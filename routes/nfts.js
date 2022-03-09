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

        nftReader.downloadNFTZip(nftPostHashHex, arweaveUrl)
        .then((savePath)=>{
          let modelVersionFolderName = ''; //default
          let extractPath = Path.resolve('public', 'models/',nftPostHashHex);
          var modelFormat = '';
          console.log('downloaded: ',savePath);
          nftReader.extractModel(nftPostHashHex, savePath, extractPath,res);

        }).catch((err)=>{
          let nftData = {success:false,'message':'downloadNFTZip failed.'+r.statusText};
          let viewData = nftData;        
          res.send(viewData);            
        });

      }).catch((r)=>{
          let viewData = {success:false,'message': 'downloadNFTZip failed: '+r.statusText};
          res.send(viewData);
          console.log(r);
    });
  }
});

module.exports = router;
