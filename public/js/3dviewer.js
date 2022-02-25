 (function() { 

	var container;

	var camera, controls, scene, renderer;

	var cameraFov = 60;

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
		//console.log('adding listener for '+modelUrl);
		el.addEventListener("click", (e)=>{
			e.preventDefault();
			e.stopPropagation();
			console.log('init three for: '+modelUrl);
			initThree(modelUrl);
		});		
 	}
	
 	initModel = (el) => {
 		const that = this;
 		let nftPostHash = 'a183b36867a953166bef9e3f5f461bb3b0c772da50093acf614331313fee2a8d';
 		let url = '/nfts/'+nftPostHash;
 		fetch(url)
 		.then(response => response.json())
 		.then((data)=>{	

 			if(data !== undefined){
 				let fullUrl = '/models/'+nftPostHash+data.modelUrl;
 				let link = this.updateUI(el, fullUrl);
 				this.addClickListener(link, fullUrl);
 			};

 		}).catch(err => alert(err));

 	}

	function initThree(modelUrl) {
	  container = document.getElementById( 'container' );
let rendererHeight = container.offsetHeight;
let rendererWidth = container.offsetWidth;
	  renderer = new THREE.WebGLRenderer( { antialias: false } );
	  renderer.setClearColor( 0xc3ffaa, 1.0 );
	  renderer.setSize( rendererWidth, rendererHeight );

	  container.innerHTML = '';
	  container.appendChild( renderer.domElement );

	  camera = new THREE.PerspectiveCamera( cameraFov, rendererWidth / rendererHeight, 0.1, 1000 );
	  camera.aspect = rendererWidth / rendererHeight;
	  camera.updateProjectionMatrix();

	  const gltfLoader = new THREE.GLTFLoader();
	  const url = modelUrl;
console.log('gltfLoader: '+url);
	  gltfLoader.load(url, (gltf) => {

	        console.log(gltf);

	    scene = new THREE.Scene();
	    const root = gltf.scene;
	    renderer.render( scene, camera );


	    var box = new THREE.Box3().setFromObject( root.children[0]);
	    var sizeX = box.getSize().x;
	    var sizeY = box.getSize().y;
	    var sizeZ = box.getSize().z;
	    console.log(sizeX, sizeY, sizeZ);
	    console.log(box.getSize());
	    let objectSize = Math.max( sizeX, sizeY );
	    console.log('max size: ',objectSize);
	    // Calculate the camera distance

	    var aspect = rendererWidth / rendererHeight;
	    var fov = cameraFov * ( Math.PI / 180 );

	      console.log('fov: ',fov);
	    var distance = Math.abs( objectSize / Math.sin( fov / 2 ) );
	       console.log('distance: ',distance);     
	    var cameraPosition = new THREE.Vector3(
	    0,
	    scene.children[0].position.y + Math.abs( objectSize / Math.sin( fov / 2 ) ),
	    0);
	    console.log(cameraPosition);
	    //camera.position.set(cameraPosition);
	    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
	    renderer.render( scene, camera );

	  });

	}

	function animate() {

	  requestAnimationFrame( animate );
	  render();

	} 	

 	let nfts = Array.from(document.getElementsByClassName('nft-viewer'));

 	nfts.forEach(this.initModel);


 })(this);