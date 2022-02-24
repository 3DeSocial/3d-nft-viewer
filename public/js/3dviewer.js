 (function() { 

 	updateUI = (el, modelUrl) => {
		//console.log('showing button for '+modelUrl);
		var a = document.createElement('a');
      	var linkText = document.createTextNode("Click to View in 3D");
			a.appendChild(linkText);
			a.title = "View in 3D";
			a.href = "#";
		var viewerEl = el;
			viewerEl.innerHTML ='';
			viewerEl.appendChild(a);

		return a;			
 	}

 	addClickListener = (el, modelUrl) => {
		console.log('adding listener for '+modelUrl);
		el.addEventListener("click", (e)=>{
			e.preventDefault();
			e.stopPropagation();
			console.log('init three for: '+modelUrl);
		});		
 	}

 	initViewer = () => {
 		let modelUrl = this.url;
		console.log('Load Three JS Environment for '+modelUrl);
 	}
 	
 	initModel = (el) => {
 		const that = this;
 		let url = '/nfts/a183b36867a953166bef9e3f5f461bb3b0c772da50093acf614331313fee2a8d'
 		fetch(url)
 		.then(response => response.json())
 		.then((data)=>{	

 			if(data !== undefined){
 				console.log(data);
 				let link = this.updateUI(el, data.modelUrl);
 				this.addClickListener(link, data.modelUrl);
 			};

 		}).catch(err => alert(err));

 	}

 	let nfts = Array.from(document.getElementsByClassName('nft-viewer'));

 	nfts.forEach(this.initModel);


 })(this);