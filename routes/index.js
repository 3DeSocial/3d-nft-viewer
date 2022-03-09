var express = require('express');
const app = express();

var router = express.Router();
var NFTReader = require('../services/NFTReader.js');
const Axios = require('axios') 
const Fs = require('fs')  
const Path = require('path') 

/* View the NFT using GET request */
router.get('/:nftPostHashHex', function(req, res, next) {
  
  let nftPostHashHex = req.params.nftPostHashHex;

  if(nftPostHashHex==='favicon.ico'){
    res.send('not an nft');
    return;
  };

  let nftReader = new NFTReader({
      nodeEndpoint: 'https://node.deso.org/api/v0/',
      readerPublicKey: 'BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7',
      modelStorageDir: 'public/models/'
  });

  nftReader.fetchNft(nftPostHashHex).then((r)=>{

    if(r.data){
        let nftData = r.data;
        
        if(nftData.PostFound.ImageURLs[0]){
          let previewImg = (nftData.PostFound.ImageURLs[0]?nftData.PostFound.ImageURLs[0]:null);
          console.log({ title: 'Express',
          nftData: nftData,
          previewImg:previewImg,
          nftPostHashHex: nftPostHashHex });

          res.render('index', { title: 'Express',
          nftData: nftData,
          previewImg:previewImg,
          nftPostHashHex: nftPostHashHex });
        };
    };
  });

});

module.exports = router;
