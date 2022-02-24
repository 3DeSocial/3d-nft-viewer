'use strict';
var axios = require('axios');

class NFTReader {
  constructor() {
    this.initDeSoClient();
  }
  parseNftLink(name) {
    this._name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  initDeSoClient(){
    this.desoNodeClient = axios.create({
      baseURL: 'https://node.deso.org/api/v0/',
      withCredentials: false,
      headers: {
                  // Overwrite Axios's automatically set Content-Type
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
              }
    });  

    /*
     * Add a response interceptor
     */
    this.desoNodeClient.interceptors.response.use(
        (response) => {
            return response;
        },
        function (error) {
            console.log(error);
            return Promise.reject(error);
        }
    );
    console.log('client initialized');
  }

  fetchNft(nftPostHashHex) {

    const payload = {
        ReaderPublicKeyBase58Check: 'BC1YLh3GazkEWDVqMtCGv6gbU79HcMb1LKAgbYKiMzUoGDEsnnBSiw7',
        PostHashHex: nftPostHashHex
    };

    const payloadJson = JSON.stringify(payload);
    return this.desoNodeClient.post('get-single-post', payloadJson, {
              headers: {
                    // Overwrite Axios's automatically set Content-Type
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
          });
    }
 
  parse3DExtraData = (NFT3DData) =>{
    let modelExtraData = JSON.parse(NFT3DData);
    return modelExtraData['3DModels'];
}
  
 
};
module.exports = new NFTReader();