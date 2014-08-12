
function horsecanvas(canvas_element, eventhandler){
    var canvas, stage;
    var context;
    var mode;

    var drawingCanvas;
    var oldPt;
    var oldMidPt;
    var color;
    var stroke;
    var stamps;

    canvas = canvas_element
    context = canvas.getContext("2d");
    color = "#000000";
    mode = "stroke";
    stroke = 10;
    stamp_url = 'images/argy_bee.png';
    //check to see if we are running in a browser with touch support
    stage = new createjs.Stage(canvas);
    stage.autoClear = false;
    stage.enableDOMEvents(true);
    createjs.Touch.enable(stage);
    createjs.Ticker.setFPS(24);
    drawingCanvas = new createjs.Shape();
    stage.addChild(drawingCanvas);
    stamps = []

    function handleMouseDown(event) {
        if( mode == 'stroke'){
            oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
            oldMidPt = oldPt;
            stage.addEventListener("stagemousemove" , handleMouseMove);
            drawingCanvas.graphics.clear()
                .setStrokeStyle(stroke, 'round', 'round')
                .beginStroke(color)
                .moveTo(oldPt.x, oldPt.y)
                .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
            stage.update();
        }
    }
    function handleMouseMove(event) {
        var midPt = new createjs.Point(oldPt.x + stage.mouseX>>1, oldPt.y+stage.mouseY>>1);
        drawingCanvas.graphics.clear()
            .setStrokeStyle(stroke, 'round', 'round')
            .beginStroke(color)
            .moveTo(midPt.x, midPt.y)
            .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
        oldPt.x = stage.mouseX;
        oldPt.y = stage.mouseY;
        oldMidPt.x = midPt.x;
        oldMidPt.y = midPt.y;
        stage.update();
    }
    function handleMouseUp(event) {
        if(mode == 'stroke'){
            stage.removeEventListener("stagemousemove" , handleMouseMove);
        }
        else{
            if(mode == 'stamp'){
                console.log("STAMPIN", stamp_url);
                var bitmap = new createjs.Bitmap(stamp_url);
                bitmap.x = stage.mouseX;
                bitmap.y = stage.mouseY;
                stage.addChild(bitmap);
                stage.update();
                stamps.push(stamp_url);
                eventhandler.emit("stamped", stamp_url);
            }
        }
    }
    
    // Global Event Handlers
    function changeColor(newcolor){
        console.log("change color:", newcolor);
        color = newcolor;
    }
    function changeSize(newsize){
        mode = 'stroke';
        stroke = newsize;
    }
    function completeCanvas(){
        var analysis = HorseRank.analyze(canvas, context);
        console.log(analysis);
        var img = canvas.toDataURL("image/png");
        eventhandler.emit('newImage', img, analysis, stamps);
        eventhandler.emit('clearCanvas');
    }
    function clearCanvas(){
        console.log("clearing canvas");
        
        /* http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing */
        // Store the current transformation matrix
        context.save();

        // Use the identity matrix while clearing the canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Restore the transform
        context.restore();

        stage.removeAllChildren();
        drawingCanvas = new createjs.Shape();
        stage.addChild(drawingCanvas);
        
        stamps = [];
    }
    function setStamp(url){
        console.log('stamp set');
        mode = 'stamp';
        stamp_url = url;
    }
    function setBackground(url){
        var image = new Image();
        image.src = url;
        image.onload = function(){
            drawingCanvas.graphics.clear()
                .beginBitmapFill(image)
                .drawRect(0, 0, canvas.width, canvas.height)
            stage.update();
        }
    }

    eventhandler.bind('changeColor', changeColor);
    eventhandler.bind('changeSize', changeSize);
    eventhandler.bind('clearCanvas', clearCanvas);
    eventhandler.bind('completeCanvas', completeCanvas);
    eventhandler.bind('setStamp', setStamp);
    eventhandler.bind('setBackground', setBackground);

    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.update();
   
}

function horsecursor(elem, emitter){
    function setBrushCursor(size){
        var adjust = parseInt(size/2);
        $(elem).css('cursor', 'url(images/'+size+'x'+size+'.png) '+adjust+' '+adjust+', auto');
    }

    function setStampCursor(stamp_url){
        $(elem).css('cursor', 'url('+stamp_url+'), auto');
    }

    emitter.bind('changeSize', setBrushCursor);
    emitter.bind('setStamp', setStampCursor);
}

function bin(emitter){
    var duration = 150;

    function selectBin(toggle, group){
        console.log("selectBin", toggle, group);
        $('.visible_bin').transition({x:"0px"}, duration, 'ease');
        setTimeout(function(){
            $("."+group).hide();
            $("."+toggle).show();
        }, duration);
        $('.visible_bin').transition({x:"200px"}, duration, 'ease');
    }

    function closeBin(){
        $('.visible_bin').transition({x:"0px"}, duration, 'ease');
    }
    emitter.on("selectBin", selectBin);
    emitter.on("closeBin", closeBin);
}

function currentColor(element, emitter){
    var changeColor = function(newcolor){
        $(element).css({"background-color":newcolor});
    }

    emitter.on("changeColor", changeColor)
}

$(function() {
    var emitter = new LucidJS.EventEmitter();
    var canvas = document.getElementById("horse");

    bin(emitter);
    horsecanvas(canvas, emitter);
    horsecursor($('body'), emitter);
    currentColor($('.current_color'), emitter);
    
    emitter.emit("changeSize", 10)

    $("#done").click(function(){
        emitter.emit("completeCanvas");
    });
    $("#clear").click(function(){
        emitter.emit("clearCanvas");
    });
    $(".color").click(function(el){
        emitter.emit("changeColor", $(el.target).data('color')) 
        emitter.emit("closeBin")
    });
    $(".brush").click(function(el){
        emitter.emit("changeSize", parseInt($(el.target).data('size'), 10))
        emitter.emit("closeBin")
    });
    $(".stamp").click(function(el){
        emitter.emit("setStamp", $(el.target).data('url'));
        emitter.emit("closeBin")
    });
    $(".background").click(function(el){
        emitter.emit("setBackground", $(el.target).data('url'));
        emitter.emit("closeBin")
    });
    $(".toggle").click(function(el){
        emitter.emit("selectBin", $(el.target).data('toggle'), $(el.target).data('group'));
    });
});

