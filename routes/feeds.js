var express = require('express');
var router = express.Router();
var profileReader = require('../services/DeSoProfileReader.js');
var feedReader = require('../services/DeSoFeedReader.js');
const Axios = require('axios') 
const Fs = require('fs')  

router.get('/:publicKey', (req, res) => {

  const publicKey = req.params.publicKey;

  feedReader.fetchNFTFeed(publicKey).then((r)=>{
        if(!r.data){
          req.send('error retrieving nfts');
        };

        let xrNFTs = [];

        if(r.data){
          if(r.data.NFTsMap){
            let allNFTs = r.data.NFTsMap;
            for(i in allNFTs){
              let nft = allNFTs[i];
              let PostExtraData = nft.PostEntryResponse.PostExtraData;
              if(PostExtraData){
                  if(PostExtraData['3DExtraData']){
                    let previewImage = (nft.PostEntryResponse.ImageURLs[0])?nft.PostEntryResponse.ImageURLs[0]:'';
                    let nftData = {previewImage: previewImage,
                                  message: nft.PostEntryResponse.Body,
                                  nftPostHashHex: nft.PostEntryResponse.PostHashHex};
                    xrNFTs.push(nftData);
                  };
              };
            };

          }
        };

        profileReader.fetchProfile(publicKey).then((r)=>{
          if(r.data.UserList){
            let user = r.data.UserList[0];
            let userName = user.ProfileEntryResponse.Username;
            res.render('feeds', { title: publicKey,
                nfts: xrNFTs,
                publicKey:publicKey,
                userName: userName});
          }
        });
  
  });
 
});

module.exports = router;
