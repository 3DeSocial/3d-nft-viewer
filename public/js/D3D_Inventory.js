export const name = 'd3d-space-viewer';
let THREE, GLTFLoader, OrbitControls, XRControllerModelFactory, VRButton;

class Item {

    constructor(config){
        let defaults = {
            modelUrl: '',
            modelsRoute: 'models'
        };
    
        this.config = {
            ...defaults,
            ...config
        };
        
        THREE = this.config.three;
        this.gltfLoader = this.config.gltfLoader;
        this.scene = this.config.scene;
        this.height = this.config.height;
        this.width = this.config.width;
        this.depth = this.config.depth;
        this.modelURL = this.config.modelURL

    }

    place = (pos) =>{

        let that = this;

        this.fetchModelURL()
            .then((modelURL)=>{
                this.fetchModel(modelURL)
                .then((model)=>{
                    this.mesh = model;
                    //that.setScale(model);

                 //   that.rotateItem();
                    that.addToScene(model);
                    that.positionItem(model, pos);

                })
            });
    }

    fetchModelURL = async() =>{
        let that = this;
        return new Promise((resolve,reject)=>{
            let url = '/nfts/'+that.config.nftPostHashHex;
                console.log('fetchModelURL from: '+url);

            fetch(url,{ method: "post"})
            .then(response => response.json())
            .then((data)=>{ 

                if(data !== undefined){
                    let fullUrl = '/'+that.config.modelsRoute+'/'+that.config.nftPostHashHex+data.modelUrl;
                    resolve(fullUrl);
                } else {
                    reject();
                }
            });
        })
    }

    fetchModel = async(modelURL) =>{
        
        let that = this;

        return new Promise((resolve,reject)=>{

            console.log('create container:',that.config.width, that.config.height,that.config.depth);
            const geometry = new THREE.BoxGeometry(2,2,4);
            
            if(!that.config.color){
                that.config.color = 0xfffff;
            };
            
            const material = new THREE.MeshPhongMaterial({
                color: that.config.color,
                opacity: 0,
                transparent: true
            });

            let boxMesh = new THREE.Mesh( geometry, material );
            this.scene.add(boxMesh);
            let sceneBounds = new THREE.Box3().setFromObject( boxMesh );
            let meshBounds = null;

            that.gltfLoader.load(modelURL, (model)=> {

                let gltfMesh = null;

                gltfMesh = model.scene;
                let meshBounds = new THREE.Box3().setFromObject( gltfMesh );


                // Calculate side lengths of scene (cube) bounding box
                let lengthSceneBounds = {
                  x: Math.abs(sceneBounds.max.x - sceneBounds.min.x),
                  y: Math.abs(sceneBounds.max.y - sceneBounds.min.y),
                  z: Math.abs(sceneBounds.max.z - sceneBounds.min.z),
                };   

                // Calculate side lengths of glb-model bounding box
                let lengthMeshBounds = {
                  x: Math.abs(meshBounds.max.x - meshBounds.min.x),
                  y: Math.abs(meshBounds.max.y - meshBounds.min.y),
                  z: Math.abs(meshBounds.max.z - meshBounds.min.z),
                };

                console.log('lengthMeshBounds');
                console.log(lengthMeshBounds);     

                // Calculate length ratios
                let lengthRatios = [
                  (lengthSceneBounds.x / lengthMeshBounds.x),
                  (lengthSceneBounds.y / lengthMeshBounds.y),
                  (lengthSceneBounds.z / lengthMeshBounds.z),
                ];

                let minRatio = Math.min(...lengthRatios);
                boxMesh.add(gltfMesh);
                // Use smallest ratio to scale the model
                gltfMesh.scale.set(minRatio, minRatio, minRatio);
                gltfMesh.position.set(0,0,0);        
                resolve(boxMesh);
            });

        })
      
    }
    setScale = (model) =>{

        let lengthSceneBounds = {
          x: 1,
          y: 2,
          z: 1,
        };

        let meshBounds = this.getMeshBounds(model);
        
        let lengthMeshBounds = {
          x: Math.abs(meshBounds.max.x - meshBounds.min.x),
          y: Math.abs(meshBounds.max.y - meshBounds.min.y),
          z: Math.abs(meshBounds.max.z - meshBounds.min.z),
        }

        let lengthRatios = [
          (lengthSceneBounds.x / lengthMeshBounds.x),
          (lengthSceneBounds.y / lengthMeshBounds.y),
          (lengthSceneBounds.z / lengthMeshBounds.z),
        ];
        
        let minRatio = Math.min(...lengthRatios);

        model.scale.set(minRatio, minRatio, minRatio);

    }

    getMeshBounds = (model) => {
        let that = this;
        let meshBounds = null;
        console.log(model);
        model.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.geometry.computeBoundingBox()
                meshBounds = child.geometry.boundingBox;
                console.log(meshBounds);
            }
        });
        return meshBounds;
    }

    positionItem = (model, posVector) =>{
        model.position.copy(posVector);
        console.log('position set');
        console.log(model);
        console.log(this.scene);
    }

    rotateItem = () =>{

    }

    addToScene = (model) =>{
        console.log('adding to scene');
        this.scene.add(model);
    }

}

 class D3DInventory {
    
    constructor(config) {

        let defaults = {
                    items: []
                };
        
        this.config = {
            ...defaults,
            ...config
        };

        THREE = this.config.three;
        this.scene = this.config.scene;
        this.gltfLoader = this.config.gltfLoader;

        console.log('D3DInventory');
        console.log(THREE);

        this.items = [];

        this.load();
      
    }

    load = () =>{
        this.initItems(this.config.items);
    }

    initItems = (itemList)=>{

        let that = this;
        console.log('initItems');
        console.log(itemList);
        itemList.forEach((itemData)=>{
            itemData.three = THREE;
            itemData.scene = this.scene;
            itemData.gltfLoader = this.gltfLoader;
            let item = new Item(itemData);
            that.items.push(item);

        })
    }

    getItems = () =>{
        return this.items;
    }


 }
export {D3DInventory, Item};