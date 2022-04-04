var express = require('express');
const app = express();

var router = express.Router();
var D3DNFT = require('3d-nft-viewer');
const Axios = require('axios') 
const Fs = require('fs')  
const Path = require('path') 

router.get('/', function(req, res, next) {
  res.render('collection', { title: '3D NFT Collection'});
});

router.post('/fetch', function(req, res, next) {

  const userName = req.body.userName;
  let feedReader = new D3DNFT.FeedReader();
  let profileReader = new D3DNFT.ProfileReader();
      profileReader.getUserInfo('BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7', userName).then((user)=>{

    if(user){
      let publicKey = user.Profile.PublicKeyBase58Check;

      feedReader.fetchNFTFeed(publicKey).then((r)=>{
        if(!r.data){
          req.send('error retrieving nfts');
        };

        xrNFTs = feedReader.filterNFTFeed(r.data);
        
          res.send({ title: '3D NFT Collection Of '+userName,
                nfts: xrNFTs,
                publicKey:publicKey,
                userName: userName});

      });
    }
  })
})

module.exports = router;
