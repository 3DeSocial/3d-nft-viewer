var express = require('express');
var router = express.Router();
var D3DNFT = require('3d-nft-viewer');
const Axios = require('axios') 
const Fs = require('fs')  

router.post('/', (req, res) => {

  // recieve username as post request from feed form
  const userName = req.body.username;

  let feedReader = new D3DNFT.FeedReader();
  let profileReader = new D3DNFT.ProfileReader();
   profileReader.getUserInfo('BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7', userName).then((user)=>{

    if(user){
      let publicKey = user.Profile.PublicKeyBase58Check;

      feedReader.fetchNFTFeed(publicKey).then((r)=>{
        if(!r.data){
          req.send('error retrieving nfts');
        };

        xrNFTs = feedReader.filterXRNFTs(r.data);
        
         res.render('feeds', { title: userName,
                nfts: xrNFTs,
                publicKey:publicKey,
                userName: userName});

      })
    } else {
      console.log(user);
    }
  }).catch(err =>{
    console.log('getUserInfo: error reading profile');
   // console.log(err);    
  })
 
});

//recieve username as url parameter for direct links
router.get('/:username', (req, res) => {

  const userName = req.params.username;

  let feedReader = new D3DNFT.FeedReader();
  let profileReader = new D3DNFT.ProfileReader();
   profileReader.getUserInfo('BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7', userName).then((user)=>{

    if(user){
      let publicKey = user.Profile.PublicKeyBase58Check;
      let username = user.Profile.Username;
      
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
         res.render('feeds', { title: userName,
                nfts: xrNFTs,
                publicKey:publicKey,
                userName: userName});

      })
    } else {
      console.log(user);
    }
  }).catch(err =>{
    console.log('getUserInfo: error reading profile');
   // console.log(err);    
  })
 
});

module.exports = router;
