var express = require('express');
var router = express.Router();
var NFTReader = require('../services/NFTReader.js');

router.post('/:nftPostHashHex', (req, res) => {

  const nftPostHashHex = req.params.nftPostHashHex;

  let nftReader = new NFTReader({
      nodeEndpoint: 'https://node.deso.org/api/v0/',
      readerPublicKey: 'BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7',
      modelStorageDir: 'public/models/'
  });

  nftReader.retrieveNFT(nftPostHashHex)
  .then((responseJson)=>{
    res.send(responseJson);
  }).catch((responseJson)=>{
    console.log(responseJson);
    console.log('retrieveNFT error');
    res.send(responseJson);
  });

});

module.exports = router;