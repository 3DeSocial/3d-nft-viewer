var express = require('express');
var router = express.Router();
var nftReader = require('../services/NFTReader.js');
var unzipper = require('unzipper');
const Axios = require('axios') 
const Fs = require('fs')  
const Path = require('path') 

router.post('/:nftPostHashHex', (req, res) => {

  const nftPostHashHex = req.params.nftPostHashHex;

  if(nftReader.modelIsExtracted(nftPostHashHex)){
    modelUrl = nftReader.buildModelUrlFromFiles(nftPostHashHex);
    res.send({success:true,modelUrl:modelUrl});
  } else {
    nftReader.fetchNft(nftPostHashHex).then((r)=>{

        let nftData = r.data;
        let previewImg = (r.data.PostFound.ImageURLs[0]?nftData.PostFound.ImageURLs[0]:null);
        let viewData = {title: nftPostHashHex,
                        nftData:nftData};

        if(nftData.PostFound.ImageURLs[0]){
          viewData.previewImg = previewImg;
        };

        let extraData = nftData.PostFound.PostExtraData['3DExtraData'];
        let models = nftReader.parse3DExtraData(extraData);
        let arweaveUrl = models[0].ModelUrl;

        downloadNFTZip(nftPostHashHex, arweaveUrl)
        .then((savePath)=>{
          let modelVersionFolderName = ''; //default
          let extractPath = Path.resolve('public', 'models/',nftPostHashHex);
          var modelFormat = '';
          extractModel(nftPostHashHex, savePath, extractPath,res);

        }).catch((err)=>{
          let nftData = {success:false,'message':'downloadNFTZip failed.'+r.statusText};
          let viewData = nftData;        
          res.send(viewData);            
        });

      }).catch((r)=>{
          let viewData = {success:false,'message': r.status+' '+r.statusText};
          res.send(viewData);
    });
  }
});

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

  extractModel = (nftPostHashHex, savePath, extractPath, res) =>{
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
          modelUrl = nftReader.buildModelUrlFromFiles(nftPostHashHex);
          res.send({modelUrl:modelUrl});
      })
      .catch(err=>{
        console.log('extract err: ');
        console.log(err);
      });
  }

  makeDirIfNotExists = (dirPath) =>{
    if (!Fs.existsSync(dirPath)) {    
      Fs.mkdirSync(dirPath, (err) => {
        if (err) {
            return console.error(err);
        }
      });
    }
  }


module.exports = router;
