 class D3DNFTViewer {
    
    constructor(config) {

        let defaults = {
                    el: document.body,
                    ctrClass: 'data-nft', // Attribute of div containing nft preview area for a single nft
                    nftsRoute: 'nfts', // Back end route to initialize NFTs
                    modelsRoute: 'models' // Back end route to load models
                };
        
        this.config = {
            ...defaults,
            ...config
        };

        this.isFullScreen = false;

    }

    initContainer(parentDivEl){
        //First lets create a parent DIV
        this.parentDivEl = parentDivEl;

        this.parentDivElWidth = this.parentDivEl.children[0].offsetWidth;
        this.parentDivElHeight = this.parentDivEl.children[0].offsetHeight;

        //Lets create a new Scene
        this.scene = new THREE.Scene();
        if(this.config.skyboxes !== false){
            let skyBoxList = ['blue','bluecloud','browncloud','lightblue','yellowcloud'];
            let skyBoxNo = this.getRandomInt(0,4);
            let skyBox = this.loadSkyBox(skyBoxList[skyBoxNo]);
            this.scene.background = skyBox;
        };
        
        //Create a camera
        this.camera = new THREE.PerspectiveCamera(60, this.parentDivElWidth/this.parentDivElHeight, 0.01, 1000 );
        //Only gotcha. Set a non zero vector3 as the camera position.
        this.camera.position.set(0,0,0.1);

        //Create a WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({antialias: true,
                alpha: true,
                preserveDrawingBuffer: true});
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        this.renderer.setClearColor( 0x000000, 1 );
        this.renderer.domElement.setAttribute('style','display:none;');
        this.parentDivEl.appendChild(this.renderer.domElement);

        //Loader GLTF
        this.gltfLoader = new THREE.GLTFLoader();

        //Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        //Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        //Add dirlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(-4,15,10);
        this.scene.add(directionalLight);

        this.animate();
        this.addEventListenerResize();
        this.addEventListenerExitFullScreen();


    }

    getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    loadSkyBox(boxname){

        let skybox ='';

        const loader = new THREE.CubeTextureLoader();
              loader.setPath( '/images/skyboxes/'+boxname+'/' );

        switch(boxname){
            case 'bluecloud':
                skybox = loader.load([
                            'bluecloud_ft.jpg',
                            'bluecloud_bk.jpg',
                            'bluecloud_up.jpg',
                            'bluecloud_dn.jpg',
                            'bluecloud_rt.jpg',
                            'bluecloud_lf.jpg']);
            break;
            case 'yellowcloud':
                skybox = loader.load([
                            'yellowcloud_ft.jpg',
                            'yellowcloud_bk.jpg',
                            'yellowcloud_up.jpg',
                            'yellowcloud_dn.jpg',
                            'yellowcloud_rt.jpg',
                            'yellowcloud_lf.jpg']);
            break;
            case 'browncloud':
                skybox = loader.load([
                            'browncloud_ft.jpg',
                            'browncloud_bk.jpg',
                            'browncloud_up.jpg',
                            'browncloud_dn.jpg',
                            'browncloud_rt.jpg',
                            'browncloud_lf.jpg']);
            break;
            case 'lightblue':
                skybox = loader.load([
                            'right.png',
                            'left.png',
                            'top.png',
                            'bot.png',
                            'front.png',
                            'back.png']);
            break;             
            case 'blue':
                skybox = loader.load([
                            'bkg1_right.png',
                            'bkg1_left.png',
                            'bkg1_top.png',
                            'bkg1_bot.png',
                            'bkg1_front.png',
                            'bkg1_back.png']);
            break;
        }
        
        return skybox;
    }

    addEventListenerResize() {

        let that = this;

        window.addEventListener('resize', () => {
            that.resizeCanvas();
        });

    }

    addEventListenerExitFullScreen = () =>{
        if (document.addEventListener){
            document.addEventListener('webkitfullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('mozfullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('fullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('MSFullscreenChange', this.fsChangeHandler, false);
        }
    }

    fsChangeHandler = () =>{
            if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement !== undefined) {
            console.log('enter fulll screen');
        } else {
            console.log('exit fulll screen');
          var elem = this.renderer.domElement;
            elem.style.width = 'auto';
            elem.style.height = 'auto';
            this.isFullScreen = false;            
            this.camera.aspect = this.parentDivElWidth/this.parentDivElHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        }
    
    }

    resizeCanvas = () =>{
        if(this.isFullScreen){
            let canvasWidth = screen.width;
            let canvasHeight = screen.height;
            this.camera.aspect = canvasWidth/canvasHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvasWidth,canvasHeight);
        } else {
            this.camera.aspect = this.parentDivElWidth/this.parentDivElHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        }
        this.fitCameraToMesh(this.nftMesh);        
    }

    animate() {

        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);

    }

     fitCameraToMesh(mesh, fitOffset = 0.75) {

        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * this.camera.fov / 360));
        const fitWidthDistance = fitHeightDistance / this.camera.aspect;
        const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

        const direction = this.controls.target.clone()
            .sub(this.camera.position)
            .normalize()
            .multiplyScalar(distance);

        this.controls.maxDistance = distance * 10;
        this.controls.target.copy(center);

        this.camera.near = distance / 100;
        this.camera.far = distance * 100;
        this.camera.updateProjectionMatrix();

        this.camera.position.copy(this.controls.target).sub(direction);
        this.controls.update();
    }

    load(modeURL,cb) {
        let that = this;

        this.gltfLoader.load(modeURL, (model)=> {

            model.scene.updateMatrixWorld(true);
            that.scene.add(model.scene);            
            that.fitCameraToMesh(model.scene);
            that.nftMesh = model.scene;
            that.parentDivEl.children[0].setAttribute('style','display:none;');
            that.renderer.domElement.setAttribute('style','display:inline-block;');
            if(cb){cb()};
        })


    }

    updateUI = (el, modelUrl) => {

        let linkCtr = this.config.linkCtrCls;
        let linkView3D = this.createLinkView3D();
        this.addClickListener3D(el, linkView3D, modelUrl);

        let linkViewFull = this.createLinkFullScreen()
        this.addClickListenerFullScreen(el, linkViewFull, modelUrl);

        var viewerEl = el;
            viewerEl.appendChild(linkView3D);
            viewerEl.appendChild(linkViewFull);

        el.setAttribute('model-status','available');
    }

    createLinkView3D = () =>{
        var a = document.createElement('a');
        var linkText = document.createTextNode(this.config.linkText);
            a.appendChild(linkText);
            a.title = "View in 3D";
            a.href = "#";
            a.classList = "btn d3d-btn view-3d-btn";
        return a;
    }

    createLinkFullScreen = () =>{
        var a = document.createElement('a');
        var linkText = document.createTextNode('Full Screen');
            a.appendChild(linkText);
            a.title = "Fullscreen";
            a.href = "#";
            a.classList = "btn d3d-btn view-fullscreen-btn";
            a.setAttribute('style','display:none;');
        return a;
    }    

  openFullscreen =()=> {
      var elem = this.renderer.domElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
      elem.style.width = '100%';
      elem.style.height = '100%';
      this.isFullScreen = true;
    }

    addClickListener3D = (ctr, el, modelUrl) => {
        let that = this;
        let targetEl = this.findElFrom(this.config.previewCtrCls, ctr);

        //console.log('adding listener for '+modelUrl);
        el.addEventListener("click", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            that.updateLink(el,'Loading..');
            that.initContainer(targetEl);
            that.load(modelUrl, function(){
                el.setAttribute('style','display:none;');
                el.parentNode.getElementsByClassName('view-fullscreen-btn')[0].setAttribute('style','display:inline-block;');
            });         
        });     
    }

    addClickListenerFullScreen = (ctr, el, modelUrl) => {
        let that = this;

        //console.log('adding listener for '+modelUrl);
        el.addEventListener("click", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            that.openFullscreen();
            that.resizeCanvas(true);
        });     
    }    

    updateLink = (linkEl, linkText)=> {
        linkEl.text = linkText;
    }

    findElFrom = (elClassName, ctr) =>{
        let targetEl = null;
        let matchedEls = ctr.getElementsByClassName(elClassName);
        if(matchedEls.length>0){
            targetEl = matchedEls[0];
        };
        return targetEl;
    }

    initNFTs = (container)=>{
        if(!container){
            container = document.body;
        };
    
        let nftContainers = Array.from(container.getElementsByClassName(this.config.ctrClass));

        nftContainers.forEach(this.initModel);        
    }

    initModel = (el) => {
        const that = this;
        let modelStatus = el.getAttribute('model-status');
        if(!modelStatus){
            modelStatus = 'requested';
            el.setAttribute('model-status',modelStatus);
        };
        if(modelStatus!=='available'){
            let nftPostHash = el.getAttribute(this.config.nftDataAttr);
            let url = '/'+this.config.nftsRoute+'/'+nftPostHash;
            fetch(url,{ method: "post"})
            .then(response => response.json())
            .then((data)=>{ 

                if(data !== undefined){
                    let fullUrl = '/'+that.config.modelsRoute+'/'+nftPostHash+data.modelUrl;
                    this.updateUI(el, fullUrl);
                };

            }).catch(err => {
                console.log(err);
                console.log(response);
            });
        };

    }    
}

