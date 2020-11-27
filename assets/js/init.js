import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.122/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/OrbitControls.js";
import {TransformControls} from "https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/controls/TransformControls.js";
// import {ThreeBsp} from "";
// import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.122/examples/jsm/controls/OrbitControls.js";
import {DragControls} from "https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/DragControls.js";
import {OBJLoader} from 'https://unpkg.com/three/examples/jsm/loaders/OBJLoader.js';
// import { TransformControls } from 'http://threejs.org/examples/jsm/controls/TransformControls.js';




(function ($) {
    "use strict";
    $(function () {
        // $('.sidenav').sidenav();
    });

    $(window).on('load', function () {
        init();
        creatCellViewer()
        animate();
    });

    var fileInput = document.getElementById('fileInput');
    var canvasContainer = document.getElementById('canvasContainer');
    var d3Container = document.getElementById('d3Container');

    var options = {
        resizable: {
            handles: 'se, sw'
        },
        disableOneColumnMode: true,
        float: false,
        animate: true,
        always_show_resize_handle: true,
        cellHeight: 100,
        verticalMargin: 5,
        horizontalMargin: 5,
    };
    var grid = GridStack.init(options);
    grid.on('resizestop', function() {
        onResizeContainer();
    });

    let camera, controls, scene, renderer, raycaster, dragControls, transferControl, orbitControl;
    var mouse = {x: 0, y: 0};
    let FileContent = [];
    let currentSelectedObj = null;
    let selectableObject = [];
    // 0 for selectObj ; 1 for moveObj; 2 for rotateObj; 3 for scaleObj
    let selectMode = "0";
    let selectObjDIV, panWordDIV, moveObjDIV, rotateObjDIV, scaleObjDIV;



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

        camera = new THREE.PerspectiveCamera(70, $(canvasContainer).width() / $(canvasContainer).height(), 1, 30000);
        camera.position.set(600, 300, 0);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set( 300, 0, 300 );



        transferControl = new TransformControls(camera, renderer.domElement);
        // transferControl.setMode( "rotate" );
        // transferControl.setRotationSnap(Math.PI / 12);
        // transferControl.showY = false;
        transferControl.setMode("scale");
        transferControl.setScaleSnap(1);


        transferControl.addEventListener('change', render);
        transferControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
            if (transferControl.mode == "rotate") {

                // event.target.object.rotation.z = 0;
                // event.target.object.rotation.x = 0
            }
            else if (transferControl.mode == "translate") {

                event.target.object.position.y = 15;
                event.target.object.position.z = Math.floor(event.target.object.position.z / 10) * 10 + 5;
                event.target.object.position.x = Math.floor(event.target.object.position.x / 10) * 10 + 5;
            }
            else if (transferControl.mode == "scale") {
                // event.target.object.scale.y = 0;
                // event.target.object.scale.z = 10;
            }


        });

        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        controls.screenSpacePanning = false;

        controls.minDistance = 100;
        controls.maxDistance = 500;

        controls.maxPolarAngle = Math.PI / 2;

        const loader = new OBJLoader();
        // loader.load('http://localhost:63342/WebModelViewer3D/assets/obj/human.obj',
        //     function ( object ) {
        //         object.traverse( function ( child ) {
        //             if ( child.material ) {
        //                 child.material = new THREE.MeshBasicMaterial({color: "#0ddeb4"})
        //             }
        //         } );
        //
        //         object.name = "blabla";
        //
        //
        //         object.scale.set(5,5,5);
        //         // object.position.x = 75;
        //         // object.position.z = 75;
        //         object.position.x = 0;
        //         object.position.z = 0;
        //
        //         // scene.add( object );
        //
        //
        //
        //         // console.log(scene.getObjectByName("blabla"));
        //         // scene.remove(scene.getObjectByName("blabla"));
        //     },
        //     // called when loading is in progresses
        //     function ( xhr ) {
        //         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        //     },
        //     // called when loading has errors
        //     function ( error ) {
        //         console.log( 'An error happened' );
        //     }
        // );


        scene.add(transferControl);

        const gridHelper = new THREE.GridHelper(600, 60, 0x0000ff, 0x808080);
        gridHelper.position.x = 300;
        gridHelper.position.z = 300;
        scene.add(gridHelper);

        // lights
        const dirLight1 = new THREE.DirectionalLight(0xffffff);
        dirLight1.position.set(1, 1, 1);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0x002288);
        dirLight2.position.set(-1, -1, -1);
        scene.add(dirLight2);
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);

        window.addEventListener('resize', onResizeContainer, false);
        renderer.domElement.addEventListener('click', clickOnCanvas, false);



        selectObjDIV = document.getElementById('selectObj');
        panWordDIV = document.getElementById('panWord');
        moveObjDIV = document.getElementById('moveObj');
        rotateObjDIV = document.getElementById('rotateObj');
        scaleObjDIV = document.getElementById('scaleObj');

        selectObjDIV.addEventListener("click", selectObj, false);
        panWordDIV.addEventListener("click", panWord, false);
        moveObjDIV.addEventListener("click", moveObj, false);
        rotateObjDIV.addEventListener("click", rotateObj, false);
        scaleObjDIV.addEventListener("click", scaleObj, false);
        document.getElementById('addWall').addEventListener("click", addWall, false);
        document.getElementById('addDoor').addEventListener("click", addDoor, false);
        document.getElementById('addWindow').addEventListener("click", addWindow, false);
        document.getElementById('addVent').addEventListener("click", addVent, false);
        document.getElementById('updateCellView').addEventListener("click", updateCellView, false);


        // const geometry2 = new THREE.BoxBufferGeometry(15, 30, 15);
        // geometry2.verticesNeedUpdate = true;
        // const material2 = new THREE.MeshBasicMaterial({color: 0x032538});
        // let cube2 = new THREE.Mesh(geometry2, material2);
        // // cube2.position.x = 200;
        // // cube2.position.z = 200;
        // cube2.position.y = 15;
        // scene.add(cube2);
        // selectableObject.push(cube2);


        function bresenhamAlgorithm(x1,y1, x2,y2) {
            //Bresenham algorithm From Medium.com

            // Iterators, counters required by algorithm
            let AllPoints = [];
            let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
            // Calculate line deltas
            dx = x2 - x1;
            dy = y2 - y1;
            // Create a positive copy of deltas (makes iterating easier)
            dx1 = Math.abs(dx);
            dy1 = Math.abs(dy);
            // Calculate error intervals for both axis
            px = 2 * dy1 - dx1;
            py = 2 * dx1 - dy1;
            // The line is X-axis dominant
            if (dy1 <= dx1) {
                // Line is drawn left to right
                if (dx >= 0) {
                    x = x1;
                    y = y1;
                    xe = x2;
                } else { // Line is drawn right to left (swap ends)
                    x = x2;
                    y = y2;
                    xe = x1;
                }
                AllPoints.push({x:x , y:y});
                // console.log(x, y); // Draw first pixel
                // Rasterize the line
                for (i = 0; x < xe; i++) {
                    x = x + 1;
                    // Deal with octants...
                    if (px < 0) {
                        px = px + 2 * dy1;
                    } else {
                        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                            y = y + 1;
                        } else {
                            y = y - 1;
                        }
                        px = px + 2 * (dy1 - dx1);
                    }
                    // Draw pixel from line span at
                    // currently rasterized position
                    // console.log("------- 2 ------")
                    // console.log(x, y);
                    AllPoints.push({x:x , y:y});
                }
            } else { // The line is Y-axis dominant
                // Line is drawn bottom to top
                if (dy >= 0) {
                    x = x1;
                    y = y1;
                    ye = y2;
                } else { // Line is drawn top to bottom
                    x = x2;
                    y = y2;
                    ye = y1;
                }
                // console.log("------- 3 ------")
                // console.log(x, y); // Draw first pixel
                AllPoints.push({x:x , y:y});
                // Rasterize the line
                for (i = 0; y < ye; i++) {
                    y = y + 1;
                    // Deal with octants...
                    if (py <= 0) {
                        py = py + 2 * dx1;
                    } else {
                        if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                            x = x + 1;
                        } else {
                            x = x - 1;
                        }
                        py = py + 2 * (dx1 - dy1);
                    }
                    // Draw pixel from line span at
                    // currently rasterized position
                    // console.log("------- 4 ------")
                    // console.log(x, y);
                    AllPoints.push({x:x , y:y});
                }
            }
            // console.log(AllPoints);

            AllPoints.forEach(obj=>{
                // console.log(obj);
                let geometry2 = new THREE.BoxBufferGeometry(10, 50, 10);
                let material2 = new THREE.MeshBasicMaterial({color: 0x633568});
                let cube2 = new THREE.Mesh(geometry2, material2);

                cube2.position.x = Math.floor(obj.x) * 10 - 5;
                cube2.position.z = Math.floor(obj.y) * 10 -5;

                // cube2.position.x = Math.floor(10 * );
                cube2.position.y = 25;
                // cube2.position.z =  Math.floor(10* obj.y);
                scene.add(cube2);
            })
        }

        function updateCellView(){

            let cells = document.querySelectorAll('[id^="#"]');
            // console.log(cells);
            cells.forEach(obj=>{
                obj.style.fill = "#ffffff";
            })

            selectableObject.forEach(selectableobj=>{
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
                            x:  Math.floor(vertex.x/10) ,
                            y: Math.floor(vertex.z/10)
                        });
                    }
                }

                // // Sort based on X
                // // console.log(vertx);
                // let maxXpoint = null;
                // let maxYpoint =null;
                //
                // function sortByPosition(a, b){
                //     if (a.x == b.x) return a.y - b.y;
                //     return a.x - b.x;
                // }
                // function sortByPosition(a, b){
                //     if (a.y == b.y) return a.x - b.x;
                //     return a.y - b.y;
                // }




                let dots = [];

                // console.log(maxX + " | " + minY);
                // console.log(minX + " | " + maxY);

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


                dots.forEach(obj=>{
                    let x = Math.floor(obj.x) ;
                    let z = Math.floor(obj.y);
                    document.getElementById('#'+x + '_' + z).style.fill = "#000000";
                })


            })
        }

    }

    // ToDo change grid size based on the user's input
    function creatCellViewer(){
        let width = $(d3Container).width();
        let height = $(d3Container).height();

        var gridData = gridData();
        var grid = d3.select("#cellView")
            .append("svg")
            // ToDo change the width/height dynamically based on the on UI grid change event
            .attr("width",  $(d3Container).width())
            .attr("height",  $(d3Container).height())

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
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("class","sqrTable")
            .attr("id", function(d, i) {
                let x = 0;
                let y = 0;
                if(d.x > 10){
                    x = Math.floor(d.x / 10);
                }
                if(d.y > 10){
                    y = Math.floor(d.y / 10);
                }
                // console.log(x + "_" + y)
                return '#'+ x + "_" + y;
            })
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; })
            .style("fill", "#e6e6e6")
            .style("stroke", "#222");




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
                data.push( new Array() );
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
        event.preventDefault();
        // renderer.setSize($(canvasContainer).width(), $(canvasContainer).height());
        mouse.x = (event.offsetX / $(canvasContainer).width()) * 2 - 1;
        mouse.y = -(event.offsetY /$(canvasContainer).height()) * 2 + 1;
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

            //     transferControl.attach( intersects[ 0 ].object );
            //     // intersects[ 0 ].object.traverse( function ( child ) {
            //     //     if ( child.material ) {
            //     //         child.material = new THREE.MeshBasicMaterial({color: "#de362a"})
            //     //     }
            //     // } );
        }
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
        panWordDIV.classList.remove("--is-active");
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
        panWordDIV.classList.remove("--is-active");
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
        panWordDIV.classList.remove("--is-active");
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
        panWordDIV.classList.remove("--is-active");
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

    const geometry = new THREE.BoxBufferGeometry(10, 30, 5);
    const material = new THREE.MeshBasicMaterial({color: 0x032538});
    const materialDoor = new THREE.MeshBasicMaterial({color: 0x55eedd});
    const materialWindow = new THREE.MeshBasicMaterial({color: 0xfffdea});
    const materialVent = new THREE.MeshBasicMaterial({color: 0xe6e6fa});

    function addWall() {
        let cube = new THREE.Mesh(geometry, material);
        cube.position.y = 15;
        cube.position.z = 305;
        cube.position.x = 305;
        scene.add(cube);
        selectableObject.push(cube);
    }

    function addDoor() {
        let cube = new THREE.Mesh(geometry, materialDoor);
        cube.position.y = 15;
        cube.position.z = 305;
        cube.position.x = 305;
        scene.add(cube);
        selectableObject.push(cube);
    }
    function addWindow() {
        let cube = new THREE.Mesh(geometry, materialWindow);
        cube.position.y = 15;
        cube.position.z = 305;
        cube.position.x = 305;
        scene.add(cube);
        selectableObject.push(cube);
    }

    function addVent() {
        let cube = new THREE.Mesh(geometry, materialVent);
        cube.position.y = 15;
        cube.position.z = 305;
        cube.position.x = 305;
        scene.add(cube);
        selectableObject.push(cube);
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

        requestAnimationFrame(animate);
        // move("blabla", 0.1, 100, 100);

        controls.update();

        render();

    }

    function render() {

        renderer.render(scene, camera);

    }

})(jQuery);








// dragControls = new DragControls( [cube], camera, renderer.domElement );
// dragControls.enabled = false;
// dragControls.addEventListener( 'dragstart', function () { controls.enabled = false; } );
// dragControls.addEventListener ( 'drag', function( event ){
//     event.object.position.y = 10;
//     event.object.position.z = Math.floor(event.object.position.z/ 10)* 10 + 5;
//     event.object.position.x = Math.floor(event.object.position.x/ 10)* 10 + 5;
// })
// dragControls.addEventListener( 'dragend', function () { controls.enabled = true; } );








// function wallPositionCalculator(x, y) {
//     return ([10 *(parseInt(x) + 0.5), 10 *(parseInt(y) + 0.5)])
// }


// fileInput.addEventListener('change', function (e) {
//     var file = fileInput.files[0];
//     // var textType = /text.*/;
//     var reader = new FileReader();
//     reader.onload = function (e) {
//         var content = reader.result;
//         //Here the content has been read successfuly
//         // FileContent = content;
//         // console.log(content);
//
//         var lines = content.split('\n');
//         for (var line = 0; line < lines.length; line++) {
//             FileContent.push(lines[line].split("=")[0].split(")")[0].split("(")[1])
//         }
//         createScene();
//     };
//     reader.readAsText(file);
//
// });
//
//
// function createScene() {
//     FileContent.forEach((val) => {
//         if (typeof val !== 'undefined') {
//
//             let cube = new THREE.Mesh(geometry, material);
//
//             var geometry2 = new THREE.EdgesGeometry(cube.geometry);
//
//             var material2 = new THREE.LineBasicMaterial({color: 0x00a4ff, linewidth: 2});
//
//             var wireframe = new THREE.LineSegments(geometry2, material2);
//
//             // let temp = lines[line].split("=")[0].split(")")[0].split("(")[1];
//             // console.log(temp.split(""));
//             // console.log(lines[line].split("=")[0].split(")")[0].split("(")[1].split(",")[0]);
//             // console.log(lines[line].split("=")[0].split(")")[0].split("(")[1].split(",")[1]);
//             // scene.add( cube );
//             let position = wallPositionCalculator(val.split(",")[0], val.split(",")[1]);
//             console.log(position)
//             cube.position.x = position[0];
//             cube.position.y = 7.5;
//             cube.position.z = position[1];
//             wireframe.position.x = position[0];
//             wireframe.position.y = 7.5;
//             wireframe.position.z = position[1];
//
//             scene.add(cube);
//             scene.add(wireframe);
//
//
//             console.log();
//         }
//     })
// }