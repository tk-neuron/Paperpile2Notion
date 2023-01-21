const PROPS = PropertiesService.getScriptProperties();
const DB_ID = PROPS.getProperty('NOTION_DB_ID2');
const TOKEN = PROPS.getProperty('NOTION_TOKEN');
const FOLDER_ID = PROPS.getProperty('FOLDER_ID2');

// set status for already scanned files (stored in file Description)
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
function scanAndSendFiles(files, nMax=500, retryMax=30) {
  let count = 0;
  let retryCount = 0;

  while (files.hasNext()) {
    if (count == nMax | retryCount == retryMax) {
      break;
    }

    let file = files.next();
    // const status = file.getDescription();

    // if (status == STATUS.DONE | status == STATUS.ERROR) {
    //   continue;
    // }

    const filename = file.getName();
    const url = file.getUrl();
    const thumbnailURL = getThumbnailUrl(file.getId());
    const embedURL = getEmbedUrl(file.getId());

    // customize here according to your file naming configuration
    const [journal, firstAuthor, lastAuthor, year, title] = filename.split('_');

    try {
      const result = {
        title: title.split('.pdf')[0],
        url: url,
        journal: journal,
        firstAuthor: firstAuthor,
        lastAuthor: lastAuthor,
        year: year,
        thumbnailURL: thumbnailURL,
        embedURL: embedURL,
      };
      send2Notion(result);
      file.setDescription(STATUS.DONE);
      Logger.log(`Succeeded: ${filename}`);
      count ++;
    } 
    catch (e) {
      file.setDescription(STATUS.ERROR);
      Logger.log(e.message);
      Logger.log(`Failed: ${filename}`);
      retryCount ++;
    }
  }
}

// get cover photo for the page
function getThumbnailUrl(fileId, width=1600, authuser=0){
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}?authuser=${authuser}`;
}

function getEmbedUrl(fileId){
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

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
  const res = JSON.parse(UrlFetchApp.fetch(apiUrl, options));

  const apiUrlEmbed = `https://api.notion.com/v1/blocks/${res.id}/children`
  const objEmbed = addEmbed(result.embedURL);
  const optionsEmbed = {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
      "Authorization": "Bearer " + TOKEN,
      "Notion-Version": '2021-08-16',
    },
    payload: JSON.stringify(objEmbed),
  };
  UrlFetchApp.fetch(apiUrlEmbed, optionsEmbed);
}

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
  }
  return pageObj;
}

function addEmbed(embedUrl) {
  const pageObj = {
  "children": [
    {
      "object": "block",
      "type": "embed",
      "embed": {
        "url": embedUrl
      }
    }
  ]
  }
  return pageObj;
};
