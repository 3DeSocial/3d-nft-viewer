 (function() { 

 	updateUI = (el, res) => {
 		let modelUrl = res.url;
		console.log('showing button for '+modelUrl);
 	}

 	addClickListener = (el, res) => {
 		let modelUrl = res.url;
		console.log('adding listener for '+modelUrl);
 	}

 	initViewer = () => {
 		let modelUrl = this.url;
		console.log('Load Three JS Environment for '+modelUrl);
 	}
 	
 	initModel = (el) => {
 		const that = this;
 		let url = '/nft/4e42529372066f0fe48fdbf825a0a551ef506e8c844c6a827e3dcb9c1c158d4e'
 		fetch(url)
 		.then((res)=>{	

 			if(res !== undefined){
 				this.updateUI(el, res)
 			};

 		}).catch(err => alert(err));

 	}

 	let nfts = Array.from(document.getElementsByClassName('nft-viewer'));

 	nfts.forEach(this.initModel);


 })(this);