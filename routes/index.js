var express = require('express');
const app = express();

var router = express.Router();
var nftReader = require('../services/NFTReader.js');
const Axios = require('axios') 
const Fs = require('fs')  
const Path = require('path') 

/* GET home page. */
router.get('/', function(req, res, next) {
let nftPostHashHex = req.query.nft;

nftReader.fetchNft(nftPostHashHex).then((r)=>{

  if(r.data){
      let nftData = r.data;
      
      let previewImg = (r.data.PostFound.ImageURLs[0]?nftData.PostFound.ImageURLs[0]:null);

      let viewData = {title: nftPostHashHex,
                      nftData:nftData};

      if(nftData.PostFound.ImageURLs[0]){
        viewData.previewImg = previewImg;
      };

      res.render('index', { title: 'Express',
      nftData: viewData,
      previewImg:previewImg });
    };
});

});

module.exports = router;
