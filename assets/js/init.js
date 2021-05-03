import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.122/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/OrbitControls.js";
import {TransformControls} from "https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/controls/TransformControls.js";
import {DragControls} from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/DragControls.js";
// import {OBJLoader} from 'https://unpkg.com/three/examples/jsm/loaders/OBJLoader.js';
import { OBJLoader } from 'https://threejs.org/examples/jsm/loaders/OBJLoader.js';


(function ($) {
    "use strict";
    $(window).on('load', function () {

        init();
        createCellViewer();
        animate();


    });

    //Local test without using web server or Nodejs server
    // const doorTextureAddress = "http://localhost:8080/WebModelViewer3D/assets/textures/door.jpg";
    // const windowTextureAddress = "http://localhost:8080/WebModelViewer3D/assets/textures/window.png";
    // const ventTextureAddress = "http://localhost:8080/WebModelViewer3D/assets/textures/vent.jpg";
    // const humanObjAddress = "http://localhost:8080/WebModelViewer3D/assets/obj/human.obj";

    // On Server
    const doorTextureAddress = "https://nephilimboy.github.io/3DDesignerViewer/assets/textures/door.jpg";
    const windowTextureAddress = "https://nephilimboy.github.io/3DDesignerViewer/assets/textures/window.png";
    const ventTextureAddress = "https://nephilimboy.github.io/3DDesignerViewer/assets/textures/vent.jpg";
    const humanObjAddress = "https://nephilimboy.github.io/3DDesignerViewer/assets/obj/human.obj";

    var fileInput = document.getElementById('fileInput');
    var canvasContainer = document.getElementById('canvasContainer');
    var d3Container = document.getElementById('d3Container');

    var options = {
        resizable: {
            handles: 'se, sw'
        },
        disableOneColumnMode: true,
        float: false,
        compact: true,
        animate: true,
        always_show_resize_handle: true,
        cellHeight: 95,
        verticalMargin: 5,
        horizontalMargin: 5,
    };
    var grid = GridStack.init(options);
    grid.on('resizestop', function () {
        onResizeContainer();
    });

    let camera, controls, scene, renderer, raycaster, dragControls, transferControl;
    var mouse = {x: 0, y: 0};
    let FileContent = [];
    let currentSelectedObj = null;

    let updateRenderInterval = 0;
    let updateRenderIntervalSUB = 0;



    // ToDo fix the outline!
    // let outlineObj = null;

    // For selecting Obj
    let selectableObject = [];

    // All selectable Obj instead of walls
    let wallObjects = [];
    let doorObjects = [];
    let windowObjects = [];
    let ventObjects = [];
    let humanObjects = [];

    let wallCellCordinate = [];
    let doorCellCordinate = [];
    let windowCellCordinate = [];
    let ventCellCordinate = [];
    let humanCellCordinate = [];

    let CellCordinateMinX = null;
    let CellCordinateMinY = null;
    let CellCordinateMaxX = null;
    let CellCordinateMaxY = null;
    // 0 for selectObj ; 1 for moveObj; 2 for rotateObj; 3 for scaleObj
    let selectMode = "0";
    let selectObjDIV, /*panWordDIV,*/ moveObjDIV, rotateObjDIV, scaleObjDIV;
    const geometry = new THREE.BoxBufferGeometry(10, 30, 5);
    const material = new THREE.MeshBasicMaterial({color: 0x032538});

    // JSON editor config
    let editor = null;
    JSONEditor.defaults.options.theme = 'bootstrap3';
    var schema = {
        "title": "Scenario",
        "type": "object",
        "propertyOrder": 1,
        "properties": {
            "shape": {
                "type": "string",
                "propertyOrder": 1,
                "default": "[50, 50]"
            },
            "wrapped": {
                "type": "boolean",
                "format": "checkbox",
                "default": false,
                "propertyOrder": 2,
            },
            "default_delay": {
                "type": "string",
                "propertyOrder": 3,
                "enum": [
                    "transport",
                    "inertial",
                    "hybrid"
                ]
            },
            "default_cell_type": {
                "propertyOrder": 4,
                "type": "string"
            },
            "default_state": {
                "propertyOrder": 5,
                "type": "object",
                "title": "default_state",
                "properties": {
                    "counter": {
                        "type": "integer",
                    },
                    "concentration": {
                        "type": "integer",
                    },
                    "type": {
                        "type": "integer",
                    },
                }
            },
            "default_config": {
                "propertyOrder": 6,
                "type": "object",
                "title": "default_config",
            },
            "neighborhood": {
                "propertyOrder": 7,
                "type": "array",
                "format": "table",
                "title": "neighborhood",
                "uniqueItems": true,
                "items": {
                    "type": "object",
                    "title": "neighborhood",
                    "properties": {
                        "type": {
                            "type": "string",
                        },
                        "range": {
                            "type": "integer"
                        }
                    }
                },
            },

        }
    };


    var ALLCONS = new Array();
    var ALLCONSSCENE = new Array();
    let AllPart = [];







    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcccccc);

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2()
        renderer.setSize($(canvasContainer).width(), $(canvasContainer).height());
        var element = document.getElementById("Place3D");
        element.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(60, $(canvasContainer).width() / $(canvasContainer).height(), 1, 30000);
        camera.position.set(600, 300, 0);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(300, 0, 300);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 50;
        controls.maxDistance = 1000;
        controls.maxPolarAngle = Math.PI / 2;

        // lights
        const dirLight1 = new THREE.DirectionalLight(0xffffff);
        dirLight1.position.set(1, 1, 1);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0x002288);
        dirLight2.position.set(-1, -1, -1);
        scene.add(dirLight2);
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);

        addGridHelperAndTransferControl();

        window.addEventListener('resize', onResizeContainer, false);
        renderer.domElement.addEventListener('click', clickOnCanvas, false);

        selectObjDIV = document.getElementById('selectObj');
        moveObjDIV = document.getElementById('moveObj');
        rotateObjDIV = document.getElementById('rotateObj');
        scaleObjDIV = document.getElementById('scaleObj');

        selectObjDIV.addEventListener("click", selectObj, false);
        moveObjDIV.addEventListener("click", moveObj, false);
        rotateObjDIV.addEventListener("click", rotateObj, false);
        scaleObjDIV.addEventListener("click", scaleObj, false);
        document.getElementById('addWall').addEventListener("click", addWall, false);
        document.getElementById('addDoor').addEventListener("click", addDoor, false);
        document.getElementById('addWindow').addEventListener("click", addWindow, false);
        document.getElementById('addVent').addEventListener("click", addVent, false);
        document.getElementById('addHuman').addEventListener("click", addHuman, false);
        document.getElementById('removeOBJ').addEventListener("click", removeOBJ, false);
        document.getElementById('updateCellView').addEventListener("click", updateCellView, false);
        document.getElementById('optimizeCellView').addEventListener("click", optimizeCellView, false);
        document.getElementById('exportSceneToJSON').addEventListener("click", exportSceneToJSON, false);
        document.getElementById('resetCamera').addEventListener("click", resetCamera, false);
        document.getElementById('downloadJSON').addEventListener("click", opneJsonEditorModal, false);
        document.getElementById('saveJson').addEventListener("click", saveJson, false);
        document.getElementById('3DInput').addEventListener('change', handle3DInput, false);




        /////////////////////////////////////////////////////////////////////////////////////








        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////

// var time = "0";
        //
        // var start = 0;
        //
        //
        // // var ALLCONS = new Array();
        //
        // while (start < test.length) {
        //     var end = test.indexOf('\n', start);
        //
        //     if (end == -1) end = test.length + 1;
        //
        //     var line = test.substr(start, end - start);
        //
        //     if (line.startsWith("[")) {
        //         // parse coord
        //         var i = line.indexOf("(") + 1;
        //         var j = line.indexOf(")", i);
        //         var c = line.substr(i, j - i).split(',');
        //
        //         // parse values
        //         var i = line.indexOf("<", j) + 1;
        //         var j = line.indexOf(">", i);
        //         var values = line.substr(i, j - i).split(',');
        //
        //         // parse model name
        //         var patt = "generated by model ";
        //         var i = line.indexOf(patt, j) + patt.length;
        //         var j = line.indexOf("_(", i);
        //         var m = line.substr(i, j - i);
        //
        //         for (var i = 0; i < values.length; i++) {
        //             var v = +values[i];
        //             // var p = cfg.ports[i].name;
        //
        //             // if (v > this.max[p]) this.max[p] = v;
        //             // if (v < this.min[p]) this.min[p] = v;
        //
        //             // parsed.push(new TransitionCA("Y", this.time, m, c, p, m, v));
        //             // console.log(time + " -> " +  c + " " + v);
        //             ALLCONS[parseInt(time)].push({
        //                 p: c,
        //                 v: v
        //             })
        //         }
        //     }
        //     else {
        //         time = line
        //         if(!ALLCONS[parseInt(time)]){
        //             ALLCONS[parseInt(time)] = new Array();
        //         }
        //     };
        //
        //     var start = start + line.length + 1;
        // };
        //
        //
        //
        // var count = 0;
        //
        // ALLCONS.forEach(timeOBJArray=>{
        //
        //     const rand = (min,max) => min + Math.random()*(max-min);
        //     let particles;
        //     const MAX = 2;
        //     particles = new THREE.Group();
        //     const geo = new THREE.SphereBufferGeometry(0.1);
        //     const mat = new THREE.MeshBasicMaterial({color: 0xFF0000});
        //     for(let i=0; i<MAX; i++) {
        //         const particle = new THREE.Mesh(geo,mat)
        //         particle.velocity = new THREE.Vector3(
        //             rand(-0.01, 0.01),
        //             0.06,
        //             rand(-0.01, 0.01))
        //         particle.acceleration = new THREE.Vector3(0,-0.001,0)
        //         particle.position.x = rand(parseInt(timeOBJArray.p[1])*10 - 5,parseInt(timeOBJArray.p[1])*10 + 5)
        //         particle.position.y = rand(-1,1)
        //         particle.position.z = rand(parseInt(timeOBJArray.p[2])*10 - 5,parseInt(timeOBJArray.p[2])*10 + 5)
        //         particles.add(particle)
        //     }
        //     particles.position.z = -4
        //     particles.name = "p_" + count;
        //
        //
        //
        //     if(ALLCONSSCENE[count]){
        //         ALLCONSSCENE[count].push(particles)
        //     }
        //     else{
        //         ALLCONSSCENE[count] = new Array();
        //         ALLCONSSCENE[count].push(particles)
        //     }
        //     count ++ ;
        //
        // })



        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////







        /////////////////////////////////////////////////////////////////////////////////////


    }




















    function readSingleFile(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            // displayContents(contents);


            /////////////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////////////

            var time = "0";
            var start = 0;
            // letest = contents;
            // var ALLCONS = new Array();

            while (start < contents.length) {
                var end = contents.indexOf('\n', start);

                if (end == -1) end = contents.length + 1;

                var line = contents.substr(start, end - start);

                if (line.startsWith("[")) {
                    // parse coord
                    var i = line.indexOf("(") + 1;
                    var j = line.indexOf(")", i);
                    var c = line.substr(i, j - i).split(',');

                    // parse values
                    var i = line.indexOf("<", j) + 1;
                    var j = line.indexOf(">", i);
                    var values = line.substr(i, j - i).split(',');

                    // parse model name
                    var patt = "generated by model ";
                    var i = line.indexOf(patt, j) + patt.length;
                    var j = line.indexOf("_(", i);
                    var m = line.substr(i, j - i);

                    for (var i = 0; i < values.length; i++) {
                        var v = +values[i];
                        // var p = cfg.ports[i].name;

                        // if (v > this.max[p]) this.max[p] = v;
                        // if (v < this.min[p]) this.min[p] = v;

                        // parsed.push(new TransitionCA("Y", this.time, m, c, p, m, v));
                        // console.log(time + " -> " +  c + " " + v);
                        ALLCONS[parseInt(time)].push({
                            p: c,
                            v: v
                        })
                    }
                }
                else {
                    time = line
                    if(!ALLCONS[parseInt(time)]){
                        ALLCONS[parseInt(time)] = new Array();
                    }
                };

                var start = start + line.length + 1;
            };



            var count = 0;
            // console.log(ALLCONS);


            AllPart = [];
            const geo = new THREE.SphereBufferGeometry(1);
            const mat = new THREE.MeshBasicMaterial({color: 0xFF0000});

            ALLCONS.forEach(timeOBJArray=>{

                const rand = (min,max) => min + Math.random()*(max-min);
                let particles;
                const MAX = 10;
                particles = new THREE.Group();



                timeOBJArray.forEach((cell=>{
                    if(cell.v > 500) {
                        for (let i = 0; i < cell.v/400; i++) {
                            const particle = new THREE.Mesh(geo, mat)
                            particle.velocity = new THREE.Vector3(
                                rand(-0.01, 0.01),
                                0.06,
                                rand(-0.01, 0.01))
                            particle.acceleration = new THREE.Vector3(0, -0.001, 0)
                            particle.position.x = rand(parseInt(cell.p[0]) * 10 - 5, parseInt(cell.p[0]) * 10 + 5)
                            particle.position.y = rand(parseInt(cell.p[2]) * 5 - 5, parseInt(cell.p[2]) * 5 + 5)
                            particle.position.z = rand(parseInt(cell.p[1]) * 10 - 5, parseInt(cell.p[1]) * 10 + 5)
                            particles.add(particle)
                        }
                    }
                }));


                // particles.position.z = -4
                particles.name = "p_" + count;



                if(ALLCONSSCENE[count]){
                    ALLCONSSCENE[count].push(particles)
                }
                else{
                    ALLCONSSCENE[count] = new Array();
                    ALLCONSSCENE[count].push(particles)
                }
                count ++ ;
                AllPart.push(particles);

            })

                console.log(ALLCONS);


            /////////////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////////////







            // console.log(contents)
        };
        reader.readAsText(file);
    }


    document.getElementById('file-input')
        .addEventListener('change', readSingleFile, false);
    document.getElementById('sumulate')
        .addEventListener('click', function () {
            console.log("heheheh")
            document.getElementById('file-input').click();
        }, false);







    var counter_list = [90];
    var str_counter_0 = counter_list[0];
    // var str_counter_1 = counter_list[1];
    // var str_counter_2 = counter_list[2];
    var display_str = "000";
    var display_div = document.getElementById("display_div_id");

    // display_str =  str_counter_0.toString();
    for (var i = 0; i < display_str.length; i++) {
        var new_span = document.createElement('span');
        new_span.className = 'num_tiles';
        new_span.innerText = display_str[i];
        display_div.appendChild(new_span);
    }


    function increaseTimer(str_counter_0){
        while (display_div.hasChildNodes()) {
            display_div.removeChild(display_div.lastChild);
        }
        display_str =  str_counter_0.toString();
        for (var i = 0; i < display_str.length; i++) {
            var new_span = document.createElement('span');
            new_span.className = 'num_tiles';
            new_span.innerText = display_str[i];
            display_div.appendChild(new_span);
        }
    }







    function addGridHelperAndTransferControl(){
        transferControl = new TransformControls(camera, renderer.domElement);
        // transferControl.setMode( "rotate" );
        transferControl.setRotationSnap(Math.PI / 12);
        // transferControl.showY = false;
        transferControl.setMode("scale");
        transferControl.setScaleSnap(0.5);

        transferControl.addEventListener('change', render);
        transferControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
            if (transferControl.mode == "rotate") {
                // event.target.object.rotation.z = 0;
                // event.target.object.rotation.x = 0
            }
            else if (transferControl.mode == "translate") {

                if (currentSelectedObj.name.startsWith("wall_")) {
                    event.target.object.position.y = 15;
                }
                else if (currentSelectedObj.name.startsWith("door_")) {
                    event.target.object.position.y = 10;
                }
                else if (currentSelectedObj.name.startsWith("window_")) {
                    event.target.object.position.y = 20;
                }
                else if (currentSelectedObj.name.startsWith("vent_")) {
                    event.target.object.position.y = 50;
                }
                else if (currentSelectedObj.name.startsWith("human_")) {
                    event.target.object.position.y = 0;
                }
                event.target.object.position.z = Math.floor(event.target.object.position.z / 10) * 10 + 5;
                event.target.object.position.x = Math.floor(event.target.object.position.x / 10) * 10 + 5;

            }
            else if (transferControl.mode == "scale") {
                // event.target.object.scale.y = 0;
                // event.target.object.scale.z = 10;
            }
        });
        transferControl.name = "transferControl";
        scene.add(transferControl);

        let gridHelper = new THREE.GridHelper(600, 60, 0x0000ff, 0x808080);
        gridHelper.position.x = 300;
        gridHelper.position.z = 300;
        gridHelper.name = "gridHelper";
        scene.add(gridHelper);

        var axesHelper = new THREE.AxesHelper( 100 );
        axesHelper.name = "axesHelper";
        scene.add( axesHelper );
    }

    function updateCellView() {
        // Reset the arrays
        wallCellCordinate = [];
        doorCellCordinate = [];
        windowCellCordinate = [];
        ventCellCordinate = [];
        humanCellCordinate = [];

        let cells = document.querySelectorAll('[id^="#"]');
        cells.forEach(obj => {
            obj.style.fill = "#ffffff";
        });
        // Update cell walls
        wallObjects.forEach(selectableobj => {
            let geometry = selectableobj.geometry;
            let positionAttribute = geometry.getAttribute('position');
            let vertex = new THREE.Vector3();
            let vertx = [];
            for (let i = 0; i < 8; i++) {
                vertex.fromBufferAttribute(positionAttribute, i);
                selectableobj.localToWorld(vertex);
                if (vertex.y == 0) {
                    // console.log(vertex.x + " | " + vertex.z )
                    vertx.push({
                        x: Math.floor(vertex.x / 10),
                        y: Math.floor(vertex.z / 10)
                    });
                }
            }
            // The Bresenham's algorithm
            let dots = [];
            let x0 = vertx[0].x;
            let y0 = vertx[0].y;
            let x1 = vertx[2].x;
            let y1 = vertx[2].y;
            var dx = Math.abs(x1 - x0),
                dy = Math.abs(y1 - y0),
                sx = (x0 < x1) ? 1 : -1,
                sy = (y0 < y1) ? 1 : -1,
                err = dx - dy;
            while (true) {
                dots.push({x: x0, y: y0})
                if ((x0 == x1) && (y0 == y1) || (dy <= 1 && dx <= 1)) break;
                var e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
            // Adding cell walls to the cell view
            dots.forEach(obj => {
                let x = Math.floor(obj.x);
                let z = Math.floor(obj.y);
                wallCellCordinate.push({x:x, y:z});
                document.getElementById('#' + x + '_' + z).style.fill = "#000000";
            })
        });

        // Update cell doors
        doorObjects.forEach(obj =>{
            doorCellCordinate.push({x:Math.floor(obj.position.x / 10), y:Math.floor(obj.position.z / 10)});
            document.getElementById('#' + Math.floor(obj.position.x / 10) + '_' + Math.floor(obj.position.z / 10)).style.fill = "#00ff0c";
        });
        // Update cell windows
        windowObjects.forEach(obj =>{
            windowCellCordinate.push({x:Math.floor(obj.position.x / 10), y:Math.floor(obj.position.z / 10)});
            document.getElementById('#' + Math.floor(obj.position.x / 10) + '_' + Math.floor(obj.position.z / 10)).style.fill = "#0064ff";
        });
        // Update cell vents
        ventObjects.forEach(obj =>{
            ventCellCordinate.push({x:Math.floor(obj.position.x / 10), y:Math.floor(obj.position.z / 10)});
            document.getElementById('#' + Math.floor(obj.position.x / 10) + '_' + Math.floor(obj.position.z / 10)).style.fill = "#ffe812";
        });
        // Update cell vents
        humanObjects.forEach(obj =>{
            humanCellCordinate.push({x:Math.floor(obj.position.x / 10), y:Math.floor(obj.position.z / 10)});
            document.getElementById('#' + Math.floor(obj.position.x / 10) + '_' + Math.floor(obj.position.z / 10)).style.fill = "#e23fff";
        });
    }

    function optimizeCellView(){
        let cells = document.querySelectorAll('[id^="#"]');
        cells.forEach(obj => {
            obj.style.fill = "#ffffff";
        });
        let temp = [];

        CellCordinateMinX = null;
        CellCordinateMinY = null;
        CellCordinateMaxX = null;
        CellCordinateMaxY = null;


        let allCordinate = temp.concat(wallCellCordinate, doorCellCordinate, windowCellCordinate, ventCellCordinate, humanCellCordinate);
        allCordinate.forEach(cord=>{
            if(CellCordinateMinX == null){
                CellCordinateMinX = cord.x;
            }
            else{
                if(CellCordinateMinX >= cord.x){
                    CellCordinateMinX = cord.x;
                }
            }
            if(CellCordinateMinY == null){
                CellCordinateMinY = cord.y;
            }
            else{
                if(CellCordinateMinY >= cord.y){
                    CellCordinateMinY = cord.y;
                }
            }
            if(CellCordinateMaxX == null){
                CellCordinateMaxX = cord.x;
            }
            else{
                if(CellCordinateMaxX <= cord.x){
                    CellCordinateMaxX = cord.x;
                }
            }
            if(CellCordinateMaxY == null){
                CellCordinateMaxY = cord.y;
            }
            else{
                if(CellCordinateMaxY <= cord.y){
                    CellCordinateMaxY = cord.y;
                }
            }
        });

        if(CellCordinateMinX != null && CellCordinateMinY != null){
            wallCellCordinate.forEach(cord=>{
                document.getElementById('#' + (cord.x-CellCordinateMinX) + '_' + (cord.y-CellCordinateMinY)).style.fill = "#000000";
            });
            doorCellCordinate.forEach(cord=>{
                document.getElementById('#' + (cord.x-CellCordinateMinX) + '_' + (cord.y-CellCordinateMinY)).style.fill = "#00ff0c";
            });
            windowCellCordinate.forEach(cord=>{
                document.getElementById('#' + (cord.x-CellCordinateMinX) + '_' + (cord.y-CellCordinateMinY)).style.fill = "#0064ff";
            });
            ventCellCordinate.forEach(cord=>{
                document.getElementById('#' + (cord.x-CellCordinateMinX) + '_' + (cord.y-CellCordinateMinY)).style.fill = "#ffe812";
            });
            humanCellCordinate.forEach(cord=>{
                document.getElementById('#' + (cord.x-CellCordinateMinX) + '_' + (cord.y-CellCordinateMinY)).style.fill = "#e23fff";
            });
        }
        else{
            console.log("Somethings wrong with coordinates")
        }

    }
    // ToDo change grid size based on the user's input
    function createCellViewer() {
        let width = $(d3Container).width();
        let height = $(d3Container).height();

        var gridData = gridData();
        var grid = d3.select("#cellView")
            .append("svg")
            // ToDo change the width/height dynamically based on the on UI grid change event
            .attr("width", $(d3Container).width())
            .attr("height", $(d3Container).height())

        grid.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            // ToDo Fix the Zoom
            .scaleExtent([0, 3])
            .on("zoom", zoomed));

        const g = grid.append("g");

        var row = g.selectAll(".rowTable")
            .data(gridData)
            .enter().append("g")
            .attr("class", "rowTable");

        var column = row.selectAll(".sqrTable")
            .data(function (d) {
                return d;
            })
            .enter().append("rect")
            .attr("class", "sqrTable")
            .attr("id", function (d, i) {
                let x = 0;
                let y = 0;
                if (d.x > 10) {
                    x = Math.floor(d.x / 10);
                }
                if (d.y > 10) {
                    y = Math.floor(d.y / 10);
                }
                // console.log(x + "_" + y)
                return '#' + x + "_" + y;
            })
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.width;
            })
            .attr("height", function (d) {
                return d.height;
            })
            .style("fill", "#e6e6e6")
            .style("stroke", "#222");


        // Adding arrow and lines
        g.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr("refX", 6)
            .attr("refY", 6)
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("markerUnits","userSpaceOnUse")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 12 6 0 12 3 6")
            .style("fill", "green");


        g.append("g")
            .append("line")
            .style("stroke", "red")
            .style("stroke-width", 5)
            .attr("x1", -7)
            .attr("y1", -6)
            .attr("x2", 100)
            .attr("y2", -6)
            .attr("marker-end", "url(#triangle)");

        g.append("g")
            .append("line")
            .style("stroke", "blue")
            .style("stroke-width", 5)
            .attr("x1", -7)
            .attr("y1", -8.5)
            .attr("x2", -7)
            .attr("y2", 100)
            .attr("marker-end", "url(#triangle)");



        function zoomed({transform}) {
            g.attr("transform", transform);
        }

        function gridData() {
            var data = new Array();
            var xpos = 1;
            var ypos = 1;
            var width = 10;
            var height = 10;
            var click = 0;
            // iterate for rows
            for (var row = 0; row < 60; row++) {
                data.push(new Array());
                // iterate for cells/columns inside rows
                for (var column = 0; column < 60; column++) {
                    data[row].push({
                        x: xpos,
                        y: ypos,
                        width: width,
                        height: height,
                        click: click
                    })
                    // increment the x position. I.e. move it over by 50 (width variable)
                    xpos += width;
                }
                // reset the x position after a row is complete
                xpos = 1;
                // increment the y position for the next row. Move it down 50 (height variable)
                ypos += height;
            }
            return data;
        }
    }

    function onResizeContainer() {
        // camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize($(canvasContainer).width(), $(canvasContainer).height());
    }

    function clickOnCanvas() {
        // currentSelectedObj = null;
        // transferControl.detach();
        event.preventDefault();
        mouse.x = (event.offsetX / $(canvasContainer).width()) * 2 - 1;
        mouse.y = -(event.offsetY / $(canvasContainer).height()) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(selectableObject, true);
        if (intersects.length > 0) {
            if (currentSelectedObj != intersects[0].object) {

                if (selectMode == 0) {

                }
                else if (selectMode == 1) {
                    // Remove current object from controller
                    transferControl.detach();
                    transferControl.attach(intersects[0].object);
                }
                else if (selectMode == 2) {
                    // Remove current object from controller
                    transferControl.detach();
                    transferControl.attach(intersects[0].object);
                }
                else {
                    // Remove current object from controller
                    transferControl.detach();
                    transferControl.attach(intersects[0].object);
                }
                currentSelectedObj = intersects[0].object;
            }
        }
        // addOutlineToSelectedOBJ();
    }

    function panWord() {
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);

        for (var i = 0; i < intersects.length; i++) {
            console.log(intersects[i].point);
            // intersects[ i ].object.material.color.set( 0xff0000 );

        }
    }

    function selectObj() {
        selectObjDIV.classList.add("--is-active");
        // panWordDIV.classList.remove("--is-active");
        moveObjDIV.classList.remove("--is-active");
        rotateObjDIV.classList.remove("--is-active");
        scaleObjDIV.classList.remove("--is-active");

        selectMode = 0;
        transferControl.detach();
    }

    function moveObj() {
        transferControl.showX = true;
        transferControl.showZ = true;
        transferControl.showY = true;
        selectObjDIV.classList.remove("--is-active");
        // panWordDIV.classList.remove("--is-active");
        moveObjDIV.classList.add("--is-active");
        rotateObjDIV.classList.remove("--is-active");
        scaleObjDIV.classList.remove("--is-active");

        selectMode = 1;
        transferControl.setMode("translate");
        if (currentSelectedObj != null) {
            transferControl.detach();
            transferControl.attach(currentSelectedObj)
        }
    }

    function rotateObj() {
        transferControl.showX = true;
        transferControl.showZ = true;
        transferControl.showY = true;

        transferControl.showX = false;
        transferControl.showZ = false;

        selectObjDIV.classList.remove("--is-active");
        // panWordDIV.classList.remove("--is-active");
        moveObjDIV.classList.remove("--is-active");
        rotateObjDIV.classList.add("--is-active");
        scaleObjDIV.classList.remove("--is-active");
        selectMode = 2;
        transferControl.setMode("rotate");
        if (currentSelectedObj != null) {
            transferControl.detach();
            transferControl.attach(currentSelectedObj)
        }
    }

    function scaleObj() {
        transferControl.showX = true;
        transferControl.showZ = true;
        transferControl.showY = true;

        transferControl.showZ = false;
        transferControl.showY = false;

        selectObjDIV.classList.remove("--is-active");
        // panWordDIV.classList.remove("--is-active");
        moveObjDIV.classList.remove("--is-active");
        rotateObjDIV.classList.remove("--is-active");
        scaleObjDIV.classList.add("--is-active");

        selectMode = 3;
        transferControl.setMode("scale");
        if (currentSelectedObj != null) {
            transferControl.detach();
            transferControl.attach(currentSelectedObj)
        }
    }

    function addWall() {
        let wall = new THREE.Mesh(geometry, material);
        wall.position.y = 15;
        wall.position.z = 305;
        wall.position.x = 305;
        wallObjects.push(wall);
        wall.name = "wall_" + wallObjects.length;
        scene.add(wall);
        selectableObject.push(wall);
    }

    function addDoor() {
        let texture = new THREE.TextureLoader().load(doorTextureAddress);
        let doorGeometry = new THREE.BoxBufferGeometry(9, 20, 6);
        let doormaterial = new THREE.MeshBasicMaterial({map: texture});
        let door = new THREE.Mesh(doorGeometry, doormaterial);
        door.position.y = 10;
        door.position.z = 305;
        door.position.x = 305;
        doorObjects.push(door);
        door.name = "door_" + doorObjects.length;
        scene.add(door);
        selectableObject.push(door);
    }

    function addWindow() {
        let windowGeometry = new THREE.BoxBufferGeometry(9, 10, 6);
        let texture = new THREE.TextureLoader().load(windowTextureAddress);
        let materialWindow = new THREE.MeshBasicMaterial({map: texture});
        let window = new THREE.Mesh(windowGeometry, materialWindow);
        window.position.y = 20;
        window.position.z = 305;
        window.position.x = 305;
        windowObjects.push(window);
        window.name = "window_" + windowObjects.length;
        scene.add(window);
        selectableObject.push(window);

    }

    function addVent() {

        const radius = 4;
        const height = 15;
        const radialSegments = 6;
        let texture = new THREE.TextureLoader().load(ventTextureAddress);
        let materialVent = new THREE.MeshBasicMaterial({map: texture});
        const geometry = new THREE.ConeBufferGeometry(radius, height, radialSegments);
        let vent = new THREE.Mesh(geometry, materialVent);
        vent.position.y = 50;
        vent.position.z = 305;
        vent.position.x = 305;
        ventObjects.push(vent);
        vent.name = "vent_" + ventObjects.length;
        scene.add(vent);
        selectableObject.push(vent);

    }

    function addHuman() {
        let loader = new OBJLoader();
        loader.load(humanObjAddress,
            function (object) {
                object.traverse(function (child) {
                    if (child.material) {
                        // child.material = new THREE.MeshBasicMaterial({color: "#0ddeb4"})
                        humanObjects.push(child);
                        child.name = "human_" + humanObjects.length;
                        selectableObject.push(child);
                    }
                });
                object.name = "P_human_" + humanObjects.length;
                scene.add(object);
                let obj = scene.getObjectByName("human_" + humanObjects.length);
                obj.position.x = 300;
                obj.position.y = 0;
                obj.position.z = 300;
                obj.scale.set(4, 5, 4);
                // console.log(scene.getObjectByName("blabla"));
                // scene.remove(scene.getObjectByName("blabla"));
            },
            // called when loading is in progresses
            function (xhr) {
                // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened on loading the OBJ file');
            }
        );
    }

    function removeOBJ() {
        transferControl.detach();
        // Removing object from its array (sync)
        if (currentSelectedObj.name.startsWith("wall_")) {
            let temp = [];
            wallObjects.forEach(obj => {
                if (obj.name != currentSelectedObj.name) {
                    temp.push(obj);
                }
            });
            wallObjects = [];
            wallObjects = temp;
        }
        else if (currentSelectedObj.name.startsWith("door_")) {
            let temp = [];
            doorObjects.forEach(obj => {
                if (obj.name != currentSelectedObj.name) {
                    temp.push(obj);
                }
            });
            doorObjects = [];
            doorObjects = temp;
        }
        else if (currentSelectedObj.name.startsWith("window_")) {
            let temp = [];
            windowObjects.forEach(obj => {
                if (obj.name != currentSelectedObj.name) {
                    temp.push(obj);
                }
            });
            windowObjects = [];
            windowObjects = temp;
        }
        else if (currentSelectedObj.name.startsWith("vent_")) {
            let temp = [];
            ventObjects.forEach(obj => {
                if (obj.name != currentSelectedObj.name) {
                    temp.push(obj);
                }
            });
            ventObjects = [];
            ventObjects = temp;
        }
        else if (currentSelectedObj.name.startsWith("human_")) {
            let temp = [];
            humanObjects.forEach(obj => {
                if (obj.name != currentSelectedObj.name) {
                    temp.push(obj);
                }
            });
            humanObjects = [];
            humanObjects = temp;
        }

        // Removing From Selectable object array
        let temp = [];
        selectableObject.forEach(obj => {
            if (obj.name != currentSelectedObj.name) {
                temp.push(obj);
            }
        });
        selectableObject = [];
        selectableObject = temp;

        // Since Obj loaded, loads the human obj as a group we need to remove the parent(root) instead of the child
        if (currentSelectedObj.name.startsWith("human_")) {
            scene.remove(scene.getObjectByName("P_" + currentSelectedObj.name));
        }
        else {
            scene.remove(scene.getObjectByName(currentSelectedObj.name));
        }
        currentSelectedObj = null;
    }

    function move(objName, speed, destX, destY) {
        var mesh = scene.getObjectByName(objName);
        // console.log(mesh.position.x)
        if (mesh) {
            var dx = destX - mesh.position.x;
            var dy = destY - mesh.position.z;
            if (dx > 0) {
                if (dy > 0) {
                    console.log("dhehe")
                    mesh.position.x += Math.min(speed, dx);
                    mesh.position.z += Math.min(speed, dy);
                }

            }
        }

    }

    function animate() {


        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        updateRenderInterval ++;
        if(updateRenderInterval > 30){
            // console.log(scene)

            updateRenderInterval = 0;



            if(AllPart[updateRenderIntervalSUB]){
                // console.log('p_' + parseInt(updateRenderIntervalSUB-1))
                // console.log(AllPart[updateRenderIntervalSUB])


                    // if(scene.getObjectByName('p_' + parseInt(updateRenderIntervalSUB-1))) {
                    //      console.log("removing: " + 'p_' + parseInt(updateRenderIntervalSUB-1))
                    //     scene.remove('p_' + parseInt(updateRenderIntervalSUB-1));
                    // }


                for( var i = scene.children.length - 1; i >= 0; i--) {
                    let obj = scene.children[i];
                    if(obj.name.startsWith("p_")){
                        scene.remove(obj);
                    }
                }



                increaseTimer(updateRenderIntervalSUB);


                    // if(scene.getObjectByName('p_' + updateRenderIntervalSUB-1)) {
                    //      console.log("removing: " + 'p_' + updateRenderIntervalSUB-1)
                    //     scene.remove('removed p_' + updateRenderIntervalSUB-1);
                    // }


                    scene.add(AllPart[updateRenderIntervalSUB])






                if(updateRenderIntervalSUB >= AllPart.length -1){
                    updateRenderIntervalSUB = 0;
                }
                else{
                    updateRenderIntervalSUB ++;
                }


            }
            else{
                updateRenderInterval = 0;
            }





        }
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////


        requestAnimationFrame(animate);
        // move("blabla", 0.1, 100, 100);

        controls.update();

        render();

    }

    function render() {
        renderer.render(scene, camera);
    }

    function exportSceneToJSON(){
        transferControl.detach();
        scene.remove(controls);
        scene.remove(scene.getObjectByName("transferControl"));
        scene.remove(scene.getObjectByName("gridHelper"));
        scene.remove(scene.getObjectByName("axesHelper"));
        var result=scene.toJSON();
        var output =JSON.stringify(result);
        addGridHelperAndTransferControl();
        download(output, 'scene.json', 'application/json');
    }

    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    function handle3DInput(inp){
        transferControl.detach();
        if (inp.target.files && inp.target.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var loader = new THREE.ObjectLoader();
                loader.load(e.target.result,
                    function ( json ) {
                        // while(scene.children.length > 0){
                        //     scene.remove(scene.children[0]);
                        // }
                        scene.remove(scene.getObjectByName("transferControl"));
                        scene.remove(scene.getObjectByName("gridHelper"));
                        scene.remove(scene.getObjectByName("axesHelper"));
                        scene = json;
                        addGridHelperAndTransferControl();
                        extractObjectFromSceneToArrays();
                    }
                );
            };
            reader.readAsDataURL(inp.target.files[0]);
        }
    }

    function extractObjectFromSceneToArrays(){
        // Clear all arrays
        wallObjects = [];
        doorObjects = [];
        windowObjects = [];
        ventObjects = [];
        humanObjects = [];
        selectableObject = [];
        currentSelectedObj = null;

        // Read the scene's children and extract the OBJs
        scene.children.forEach(child=>{
            if(child.name.startsWith("wall_")){
                wallObjects.push(child);
                selectableObject.push(child);
            }
            else if(child.name.startsWith("door_")){
                doorObjects.push(child);
                selectableObject.push(child);
            }
            else if(child.name.startsWith("window_")){
                windowObjects.push(child);
                selectableObject.push(child);
            }
            else if(child.name.startsWith("vent_")){
                ventObjects.push(child);
                selectableObject.push(child);
            }
            else if(child.name.startsWith("P_human_")){
                // console.log(child.children())
                humanObjects.push(child.children[0]);
                selectableObject.push(child.children[0]);
            }
        });
    }

    // ToDo Fix the outline !
    function addOutlineToSelectedOBJ(){
        if (currentSelectedObj != null && selectMode == 0){
            let outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } );
            outlineObj = new THREE.Mesh( currentSelectedObj.geometry, outlineMaterial );
            outlineObj.position.x  = currentSelectedObj.position.x;
            outlineObj.position.y  = currentSelectedObj.position.y;
            outlineObj.position.z  = currentSelectedObj.position.z;
            outlineObj.scale.multiplyScalar(1.1);
            scene.add(outlineObj);
        }
        else{
            removeOutlineObj();
        }
    }
    function removeOutlineObj(){
        if(outlineObj != null) {
            scene.remove(outlineObj);
        }
    }

    function resetCamera(){
        controls.target.set(300, 0, 300);
        camera.position.set(600, 300, 0);
    }

    function opneJsonEditorModal(){
        var value = {
            "shape": [
                43,
                40
            ],
            "wrapped": false,
            "default_delay": "transport",
            "default_cell_type": "CO2_cell",
            "default_state": {
                "counter": -1,
                "concentration": 500,
                "type": -100
            },
            "default_config": {
                "CO2_cell": {
                    "conc_increase": 143.2,
                    "base": 500,
                    "resp_time": 1,
                    "window_conc": 400,
                    "vent_conc": 300
                }
            },
            "neighborhood": [
                {
                    "type": "von_neumann",
                    "range": 1
                }
            ]

        };
        editor = new JSONEditor(document.getElementById("editor_holder"),{
            theme: 'bootstrap3',
            schema: schema,
        });
        editor.setValue(value);
        $("#myModal").modal("show");
    }

    function saveJson(){
        let finalJason = editor.getValue();
        // getting the data from cell view
        finalJason.shape = [];
        finalJason.shape.push(CellCordinateMaxX);
        finalJason.shape.push(CellCordinateMaxY);
        finalJason.shape.push(8);
        let allCellArray= [];
        let cells = document.querySelectorAll('[id^="#"]');
        cells.forEach(obj => {
            // walls ID= #14_33
            if(obj.style.fill == "rgb(0, 0, 0)"){
                for(let ii = 0; ii <8; ii++){
                    let temp = [];
                    temp.push( parseInt(((((obj.id).split("#"))[1]).split("_"))[0]));
                    temp.push( parseInt( ((((obj.id).split("#"))[1]).split("_"))[1]));
                    temp.push(ii);
                    let cell = {
                        "cell_id": temp ,
                        "state": {
                            "concentration": 0,
                            "type": -300,
                            "counter": -1
                        }};
                    allCellArray.push(cell)
                }
            }
            // doors
            else if(obj.style.fill == "rgb(0, 255, 12)"){
                for(let ii = 0; ii <8; ii++) {
                    let temp = [];
                    temp.push(parseInt(((((obj.id).split("#"))[1]).split("_"))[0]));
                    temp.push(parseInt(((((obj.id).split("#"))[1]).split("_"))[1]));
                    temp.push(ii);
                    let cell = {
                        "cell_id": temp,
                        "state": {
                            "concentration": 400,
                            "type": -400,
                            "counter": -1
                        }
                    };
                    allCellArray.push(cell)
                }
            }
            // window
            else if(obj.style.fill == "rgb(0, 100, 255)"){
                for(let ii = 0; ii <2; ii++) {
                    let temp = [];
                    temp.push(parseInt(((((obj.id).split("#"))[1]).split("_"))[0]));
                    temp.push(parseInt(((((obj.id).split("#"))[1]).split("_"))[1]));
                    temp.push(ii+3);
                    let cell = {
                        "cell_id": temp,
                        "state": {
                            "concentration": 400,
                            "type": -500,
                            "counter": -1
                        }
                    };
                    allCellArray.push(cell)
                }
            }
            // vents
            else if(obj.style.fill == "rgb(255, 232, 18)"){
                let temp = [];
                temp.push( parseInt(((((obj.id).split("#"))[1]).split("_"))[0]));
                temp.push( parseInt( ((((obj.id).split("#"))[1]).split("_"))[1]));
                temp.push(7);
                let cell = {
                    "cell_id": temp ,
                    "state": {
                        "concentration": 300,
                        "type": -600,
                        "counter": -1
                    }};
                allCellArray.push(cell)
            }
            // human
            else if(obj.style.fill == "rgb(226, 63, 255)"){
                let temp = [];
                temp.push( parseInt(((((obj.id).split("#"))[1]).split("_"))[0]));
                temp.push( parseInt( ((((obj.id).split("#"))[1]).split("_"))[1]));
                temp.push(2);
                let cell = {
                    "cell_id": temp ,
                    "state": {
                        "concentration": 500,
                        "type": -200,
                        "counter": -1
                    }};
                allCellArray.push(cell)
            }
        });
        let temp = {};
        temp.scenario = finalJason;
        temp.cells = allCellArray;

        // Downloading the file
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(temp)], {type: 'application/json'});
        a.href = URL.createObjectURL(file);
        a.download = 'config.json';
        a.click();
        a.remove();
    }

})(jQuery);