var express = require('express');
var router = express.Router();
var D3DNFT = require('3d-nft-viewer');

router.post('/:nftPostHashHex', (req, res) => {

  const nftPostHashHex = req.params.nftPostHashHex;

  let nftReader = new D3DNFT.NFTReader({
      nodeEndpoint: 'https://node.deso.org/api/v0/',
      readerPublicKey: 'BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7',
      modelStorageDir: 'public/models/'
  });

  nftReader.retrieveNFT(nftPostHashHex)
  .then((responseJson)=>{
    res.send(responseJson);
  }).catch((responseJson)=>{
    res.send(responseJson);
  });

});

module.exports = router;