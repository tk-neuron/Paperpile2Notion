const PROPS = PropertiesService.getScriptProperties();
const FOLDER_ID = PROPS.getProperty('FOLDER_ID');
const DB_ID = PROPS.getProperty('NOTION_DB_ID');
const TOKEN = PROPS.getProperty('NOTION_TOKEN');

// set status for already sent files (stored in file Description)
const STATUS = {
  DONE: 'DONE',
  ERROR: 'ERROR',
}

// main
function myFunction() {
  const files = getFiles()
  scanAndSendFiles(files);
}

// get all files in the folder specified with id
function getFiles() {
  const targetFolder = DriveApp.getFolderById(FOLDER_ID);
  return targetFolder.getFiles();
}

// scan every file in the folder and send to Notion if not scanned yet
function scanAndSendFiles(files, nMax=500) {
  let count = 0;

  while (files.hasNext()) {
    if (count == nMax | retryCount == retryMax) {
      break;
    }

    let file = files.next();
    const status = file.getDescription();

    // skip for already sent files
    if (status == STATUS.DONE | status == STATUS.ERROR) {
      continue;
    }

    const filename = file.getName();
    const url = file.getUrl();
    const thumbnailURL = getThumbnailUrl(file.getId());

    // EDIT HERE: customize according to your file naming configuration
    const [journal, firstAuthor, lastAuthor, year, title] = filename.split('_');
    // EDIT HERE //

    try {
      // EDIT HERE: metadata to send to Notion DB //
      const result = {
        title: title.split('.pdf')[0],
        url: url,
        journal: journal,
        firstAuthor: firstAuthor,
        lastAuthor: lastAuthor,
        year: year,
        thumbnailURL: thumbnailURL,
      };
      // EDIT HERE //

      send2Notion(result);
      file.setDescription(STATUS.DONE);
      Logger.log(`Succeeded: ${filename}`);
      count ++;
    } 
    catch (e) {
      file.setDescription(STATUS.ERROR);
      Logger.log(`Failed: ${filename} with message ${e.message}`);
    }
  }
}

// get cover photo for the page
function getThumbnailUrl(fileId, width=1600, authuser=0){
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}?authuser=${authuser}`;
}

// send reference info to Notion via API
function send2Notion(result) {
  const apiUrl = 'https://api.notion.com/v1/pages';
  const obj = generateObj(result);
  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "Authorization": "Bearer " + TOKEN,
      "Notion-Version": '2021-08-16',
    },
    payload: JSON.stringify(obj),
  };
  UrlFetchApp.fetch(apiUrl, options);
}

// generate Page object
function generateObj(result) {
  const pageObj = {
    parent: {
      database_id: DB_ID,
    },
    cover: {
        "type": "external",
        "external": {
            "url": result.thumbnailURL
        }
    },
    // EDIT HERE: customize for your Database properties //
    properties: {
      "Name": {
        "title": [{
          "text": {
            "content": result.title
          }
        }]
      },
      "URL": {
        "url": result.url
      },
      "Author": {
        "multi_select": [
          {
            "name": result.firstAuthor,
          },
          {
            "name": result.lastAuthor,
          }
        ]
      },
      "Year": {
        "type": "number",
        "number": parseInt(result.year),
      },
      "Journal": {
        "type": "select",
        "select": {
          "name": (result.journal.length > 0) ? result.journal: 'Others'
        }
      }
    }
    // EDIT HERE //
  }
  return pageObj;
}
