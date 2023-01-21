# Paperpile2Notion - Use Paperpile + Notion As a Reference Manager

## About
When Paperpile stores your PDFs in Google Drive, automatically sync Notion Database with reference's metadata.

How it would look:
<img width="1000" alt="Notion Database Example" src="https://user-images.githubusercontent.com/38024515/213866746-9a531e37-c606-4259-8b5f-4e920c8a5466.png">

## Tools
- Paperpile (as reference importer + manager)
- Notion (as reference manager + editor)
- Google Drive (as PDF storage and viewer)
- GAS; Google Apps Script (as sync workflow)

## Setup
### Paperpile
- Google Drive configuration
- go to Advanced > file pattern settings 
  - example: `[Journal]_[FirstAuthor]_[LastAuthor]_[year]_[Title]`
  - please do not include '[Folder]/' since the code currently doesn't support subfolders 

### Notion
- Create a page
- Set up properties (e.g. PDF URL, title, year, journal, author)
- Set up Notion API and obtain Token
  - Set up Connections (Allow the integration to access your database)

### GAS
- Edit Script Properties
  - Google Drive Folder id: `https://drive.google.com/drive/u/0/folders/{HERE}` 
  - Notion Database id: `https://www.notion.so/{yourdomain}/{HERE}?v=hogehoge` 
  - Notion Token: check from "my integrations" of Notion API
- Customize script according to your Database Properties
