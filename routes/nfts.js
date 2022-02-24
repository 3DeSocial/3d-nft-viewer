var express = require('express');
var router = express.Router();
var nftReader = require('../services/NFTReader.js');
var unzipper = require('unzipper');
const Axios = require('axios') 
const Fs = require('fs')  
const Path = require('path') 
  var results = [];
  // nfts/<nftPostHashHex> => return modelurl for three js or start download
  router.get('/:nftPostHashHex', (req, res) => {

    const nftPostHashHex = req.params.nftPostHashHex;



    
    if(modelIsExtracted(nftPostHashHex)){
      console.log('modelIsExtracted: OK');
      modelUrl = buildModelUrlFromFiles(nftPostHashHex);
      res.send({modelUrl:modelUrl});
    } else {
      console.log('modelIsExtracted: NOPE');

      nftReader.fetchNft(nftPostHashHex).then((r)=>{
        if(r.data){
          let nftData = r.data;
          
          let previewImg = (r.data.PostFound.ImageURLs[0]?nftData.PostFound.ImageURLs[0]:null);

          let viewData = {title: nftPostHashHex,
                          nftData:nftData};

          if(nftData.PostFound.ImageURLs[0]){
            viewData.previewImg = previewImg;
          };

          let extraData = nftData.PostFound.PostExtraData['3DExtraData'];
          console.log(extraData);
          let models = nftReader.parse3DExtraData(extraData);
          console.log('models 0: ');
          console.log(models[0]);
          let arweaveUrl = models[0].ModelUrl;   
          downloadNFTZip(nftPostHashHex, arweaveUrl)
          .then((savePath)=>{
            console.log('downloaded to: '+ savePath);
            let modelVersionFolderName = ''; //default
            let extractPath = Path.resolve('public', 'models/',nftPostHashHex);
            var modelFormat = '';
            extractModel(savePath, extractPath,res);
            
          }).catch((err)=>{
            console.log('downloadNFTZip failed');
            console.log(err);
          })

    
        }
      }).catch((r)=>{
          let nftData = {'message': r.status+' '+r.statusText};
          let viewData = nftData;        
          res.send(viewData);
    });
  }
});
 fromDir = (startPath,filter)=> {

    //console.log('Starting from dir '+startPath+'/');

    if (!Fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }
    var files=Fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=Path.join(startPath,files[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isDirectory()){
            fromDir(filename,filter); //recurse
        }
        else if (filename.indexOf(filter)>=0) {
            console.log('-- found: ',filename);
            results.push(filename);
        };
    };
};

  modelIsExtracted = (nftPostHashHex) =>{
    let destDir = 'models/'+nftPostHashHex;
    let destDirPath = Path.resolve('public', 'models/',nftPostHashHex);
    if(Fs.existsSync(destDirPath)){
      return true;
    };
    console.log('dir does not exist: '+destDirPath);
    return false;
  }

  downloadNFTZip = (nftPostHashHex, arweaveUrl) => {
    
    console.log('arweaveUrl: '+ arweaveUrl);

    let tempDir = 'models_temp/'+nftPostHashHex;

    let tempDirPath = Path.resolve('public', 'models_tmp/');
    makeDirIfNotExists(tempDirPath);

    let filename = nftPostHashHex+'.zip';
    let savePath = Path.resolve('public', 'models_tmp/', filename);

   

    const writer = Fs.createWriteStream(savePath);

    Axios({
      url: arweaveUrl,
      method: 'GET',
      responseType: 'stream'
    }).then((response)=>{
      response.data.pipe(writer);
    });

    return new Promise((resolve, reject) => {
      writer.on('finish', ()=>{
        resolve(savePath);
      })
      writer.on('error', ()=>{
        console.log('error writing dled zip file');
      })
    })

  }

  extractModel = (savePath, extractPath, res) =>{
    makeDirIfNotExists(extractPath);
    console.log('extractDir created: '+extractPath);

    console.log('location of zip file: ',savePath);
    console.log('extract to: ',extractPath);

        if(Fs.existsSync('savePath')) {
        console.log("The file exists.");
      } else {
            console.log("The file does not exist:"+savePath);

      };
    unzipper.Open.file(savePath)
      .then(d => d.extract({path: extractPath, concurrency: 5}))
      .then(()=>{
                  res.send('extracted ok');
      })
      .catch(err=>{
        console.log('extract err: ');
        console.log(err);
      });
   // Fs.createReadStream(savePath).pipe(unzipper.Extract({ path: savePath }));
//   Fs.createReadStream(savePath).pipe(unzip.Extract({ path:extractPath }));
  }

buildModelUrlFromFiles = (nftPostHashHex) =>{
  let extractPath = Path.resolve('public', 'models/',nftPostHashHex);
  
  modelFormat = 'glb';
  //modelVersionFolderName = models[0].ModelFormats['glb'];

 // let extractedURL = extractPath+'\\'+modelFormat+'\\'+modelVersionFolderName;
  console.log('search folder:  '+ extractPath);

  fromDir(extractPath, '.'+modelFormat);
  let fileLocation = results[0];
  let fileLocationParts = fileLocation.split(nftPostHashHex);
  let fileUrlPart = fileLocationParts[1];
  console.log(fileUrlPart);
  //  \gltf\version1\Astrid.glb
  fileUrlPart = fileUrlPart.replace(/\\/g, '/');
  let url = '/public/models/'+nftPostHashHex + fileUrlPart;
  return fileUrlPart;
}

buildModelUrl =(nftPostHashHex)=>{
  if(models[0].ModelFormats['gltf']){
    modelVersionFolderName = models[0].ModelFormats['gltf'];
    modelFormat = 'gltf';

  } else {
    modelVersionFolderName = models[0].ModelFormats['glb'];
    modelFormat = 'glb';
  };

  let extractedURL = extractPath+'\\'+modelFormat+'\\'+modelVersionFolderName;
  let files = fromDir(extractedURL, '.'+modelFormat);
  console.log('search folder:  '+ extractedURL);
  console.log(files);

  return;
}

makeDirIfNotExists = (dirPath) =>{
  if (!Fs.existsSync(dirPath)) {    
    Fs.mkdirSync(dirPath, (err) => {
      if (err) {
          return console.error(err);
      }
    });
  } else {
    console.log('directory already exists');
  };
  console.log('created directory: ',dirPath);

}


module.exports = router;
