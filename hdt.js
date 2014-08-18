
function horsecanvas(element, eventhandler){
    var canvas, stage;
    var context;
    var mode;

    var drawingCanvas;
    var oldPt;
    var oldMidPt;
    var color;
    var stroke;
    var stamps;
    var undo_queue;
    var undo_justclicked;
    var incanvas;
    var hitarea;

    canvas = element.find("canvas")[0];
    context = canvas.getContext("2d");
    incanvas = false;
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
    undo_queue = []
    
    hitArea = new createjs.Shape();
    hitArea.graphics.beginFill("#000").drawRect(0, 0, canvas.width, canvas.height);

    function pushToUndoQueue(){
        undo_justclicked = false;
        var img = canvas.toDataURL("image/png");
        undo_queue.push(img);
        if (undo_queue.length > 10){
            undo_queue.shift();
        }
    }

    function handleMouseDown(event) {
        if( mode == 'stroke' && incanvas){
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
        if(incanvas){
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
    }
    function handleMouseUp(event) {
        if(mode == 'stroke'){
            stage.removeEventListener("stagemousemove" , handleMouseMove);
            if( incanvas ){
                pushToUndoQueue();
            }
        }
    }
    function handleClick(event) {
        if(mode == 'stamp' && incanvas){
            console.log("STAMPIN", stamp_url, stage.mouseX, stage.mouseY);
            var bitmap = new createjs.Bitmap(stamp_url);
            bitmap.x = stage.mouseX;
            bitmap.y = stage.mouseY;
            stage.addChild(bitmap);
            stage.update();
            stamps.push(stamp_url);
            eventhandler.emit("stamped", stamp_url);
            console.log("stamp click");
            pushToUndoQueue();
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
        var horsedollars = 1;
        var analysis = HorseRank.analyze(canvas, context);
        var colorhistogram = analysis.colorhistogram;
        for (var key in colorhistogram) {
            if (colorhistogram.hasOwnProperty(key) && key !== '#FFFFFF') {
                if( colorhistogram[key] > 40000 ){
                    horsedollars = horsedollars + 2;
                }
                else{
                    horsedollars = horsedollars + 1;
                }
            }
        }
        horsedollars = parseInt(horsedollars/3, 10);
        if (horsedollars > 9){
            horsedollars = 9;
        }
        console.log(analysis);
        console.log(horsedollars);
        var img = canvas.toDataURL("image/png");
        eventhandler.emit('showBreakdown', img, analysis, horsedollars);
        eventhandler.emit('newImage', img);
        eventhandler.emit('addMoney', horsedollars);
        eventhandler.emit('clearCanvas');
    }
    function clearCanvas(dont_clear_everything){
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
        drawingCanvas.hitArea = hitArea;
        drawingCanvas.on("click", handleClick);
        stage.addChild(drawingCanvas);
       
        if( dont_clear_everything === undefined ){
            stamps = [];
            undo_queue = [];
        }
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
    function undo(){
        console.log("undo!");
        if( !undo_justclicked ){
            undo_queue.pop();
            undo_justclicked = true;
        }
        if( undo_queue.length > 0 ){
            var q = undo_queue.pop();
            clearCanvas(true);
            setBackground(q);
        }
        else{
            clearCanvas();
        }
    }

    eventhandler.bind('changeColor', changeColor);
    eventhandler.bind('changeSize', changeSize);
    eventhandler.bind('clearCanvas', clearCanvas);
    eventhandler.bind('completeCanvas', completeCanvas);
    eventhandler.bind('setStamp', setStamp);
    eventhandler.bind('setBackground', setBackground);
    eventhandler.bind('undo', undo);

    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    drawingCanvas.hitArea = hitArea;
    drawingCanvas.on("click", handleClick);
    stage.update();

    $(element).find("#horse").mouseenter(function(){
        incanvas = true;
    });
    $(element).find("#horse").mouseleave(function(){
        incanvas = false;
    });
    
    $(element).find("#done").click(function(){
        eventhandler.emit("completeCanvas");
    });

    $(element).find("#clear").click(function(){
        eventhandler.emit("clearCanvas");
    });

    $(element).find("#undo").click(function(){
        eventhandler.emit("undo");
    });
}

function horsecursor(elem, emitter){
    function setBrushCursor(size){
        var adjust = parseInt(size/2);
        $(elem).css('cursor', 'url(images/brushes/'+size+'x'+size+'.png) '+adjust+' '+adjust+', auto');
    }

    function setStampCursor(stamp_url){
        $(elem).css('cursor', 'url('+stamp_url+'), auto');
    }

    emitter.bind('changeSize', setBrushCursor);
    emitter.bind('setStamp', setStampCursor);
}

function bin(element, emitter){
    var duration = 150;

    function selectBin(toggle, group){
        console.log("selectBin", toggle, group);
        $(element).find('.visible_bin').transition({x:"0px"}, duration, 'ease');
        setTimeout(function(){
            $("."+group).hide();
            $("."+toggle).show();
        }, duration);
        $(element).find('.visible_bin').transition({x:"200px"}, duration, 'ease');
    }

    function closeBin(){
        $(element).find('.visible_bin').transition({x:"0px"}, duration, 'ease');
    }
    emitter.on("selectBin", selectBin);
    emitter.on("closeBin", closeBin);
    
    $(element).find(".toggle").click(function(el){
        var toggle = $(el.target).data('toggle');
        if (toggle === undefined){
            toggle = $(el.target).parent().data('toggle');
        }
        var group = $(el.target).data('group');
        if (group === undefined){
            group = $(el.target).parent().data('group');
        }
        emitter.emit("selectBin", toggle, group);
    });
    
    $(".main").click(function(el){
        emitter.emit("closeBin")
    });
}

function currentColor(element, emitter){
    var changeColor = function(newcolor){
        $(element).css({"background-color":newcolor});
    }

    emitter.on("changeColor", changeColor);
}

function colorSelector(element, emitter){
    var source = $("#color-template").html();
    var template = Handlebars.compile(source);

    var clickColor = function(el){
        emitter.emit("changeColor", $(el.target).data('color')) 
        emitter.emit("changeSize", 10)
        emitter.emit("closeBin")
    }
    
    var addColorRow = function(color1, color1_name, color2, color2_name, color3, color3_name){
        var color_row = template({'color1':color1, 
                                  'color1_name':color1_name,
                                  'color2':color2,
                                  'color2_name':color2_name,
                                  'color3':color3,
                                  'color3_name':color3_name});
        $(element).append($(color_row).click(clickColor));
    }
    
    emitter.on("addColorRow", addColorRow);

    $(element).find(".color").click(clickColor);
    
    $(element).find(".brush").click(function(el){
        emitter.emit("changeSize", parseInt($(el.target).data('size'), 10))
        emitter.emit("closeBin")
    });
}

function stampSelector(element, emitter){
    var source = $("#stamp-template").html();
    var template = Handlebars.compile(source);
    
    var clickStamp = function(el){
        emitter.emit("setStamp", $(el.target).data('url'));
        emitter.emit("closeBin")
    }

    var addStamp = function(url, title){
        var stamp_rendered = template({'url': url, 'title':title});
        $(element).append($(stamp_rendered).click(clickStamp));
    }

    emitter.on("addStamp", addStamp);

    $(element).find(".stamp").click(clickStamp);
}

function backgroundSelector(element, emitter){
    var source = $("#background-template").html();
    var template = Handlebars.compile(source);

    var clickBackground = function(el){
        emitter.emit("setBackground", $(el.target).data('url'));
        emitter.emit("closeBin")
    }

    var addBackground = function(url, title){
        var background_rendered = template({'url': url, 'title':title});
        $(element).append($(background_rendered).click(clickBackground));
    }

    emitter.on("addBackground", addBackground);
    
    $(element).find(".background").click(clickBackground);
}

function stableSelector(element, emitter){
    var source = $("#stable-template").html();
    var template = Handlebars.compile(source);

    var clickStable = function(el){
        if( $(el.target).data('url') !== undefined){
            emitter.emit("clearCanvas");
            emitter.emit("setBackground", $(el.target).data('url'));
        }
    }

    var deleteFromStable = function(el){
        var node = $($(el)[0].currentTarget).parent();
        var url = node.data('url');
        node.transition({'scale':0.1}, 500, 'ease');
        setTimeout(function(){node.hide()}, 500)
        emitter.emit("deleteImage", url);
    }

    var newImage = function(img){
        var img_rendered = template({'img': img});
        var node = $(img_rendered);
        node.click(clickStable);
        node.find('.trashstable').click(deleteFromStable);
        $(element).append(node);
    }

    emitter.on("newImage", newImage);
    $(element).find('.stable').click(clickStable);

}

function storeManager(element, emitter){
    var source = $("#store-template").html();
    var template = Handlebars.compile(source);
    
    var addItem = function( obj ){
        var id = obj['id'];
        var price = obj['price'];
        var name = obj['name'];
        var stamp_url = obj['stamp_url'];
        var stamp_name = obj['stamp_name'];
        var color1 = obj['color1'];
        var color1_name = obj['color1_name'];
        var color2 = obj['color2'];
        var color2_name = obj['color2_name'];
        var color3 = obj['color3']
        var color3_name = obj['color3_name'];
        var background_url = obj['background_url'];
        var background_name = obj['background_name'];

        var item_rendered = template(obj);
        $(element).append(item_rendered);
    }

    var update = function( money ){
        // each store_item, if price < money, show lock.  
        $.each(item_id_list, function(i, id){
            var element = $("#"+id);
            var record = items[id];
            if( record.price <= money ){
                element.find(".visible_when_available").show();
                element.find(".lock").hide();
            }
            else{
                element.find(".visible_when_available").hide();
                element.find(".lock").show();
            }
        });
    }

    var _pay = function(id){
        var record = items[id];
        emitter.emit("payMoney", record.price);
    }

    var _buy = function(id){
        var element = $("#"+id);
        var record = items[id];
        emitter.emit("addColorRow", record.color1, record.color1_name,
                                    record.color2, record.color2_name,
                                    record.color3, record.color3_name);
        emitter.emit("addStamp", record.stamp_url, record.stamp_name);
        emitter.emit("addBackground", record.background_url, record.background_name);
        element.transition({'scale':0.1}, 500, 'ease');
        setTimeout(function(){element.hide()}, 500)
    }

    var buy = function(id){
        _buy(id);
        _pay(id);
    }

    var buyWithoutPaying = function( id ){
        _buy(id);
    }

    emitter.on("buy", buy);
    emitter.on("buyWithoutPaying", buyWithoutPaying);
    emitter.on("update", update);

    $.each(item_id_list, function(i, id){
        addItem(items[id]);
    });
    update(0);
    
    $(element).find(".storebutton").click(function(el){
        emitter.emit("buy", $(el.target).data('id'));
    });
    
}

function chartModal(emitter){
    var source = $("#modal-template").html();
    var template = Handlebars.compile(source);

    var shoo = function( img, analysis, horsedollars ){
        $("#modal").transition({scale:'0.5'}, 500).transition({x:'-1700px'}, 500);
        setTimeout(function(){
            $("#modal").remove();
            $("#overlay").remove();
            }, 1200);
    }

    var showBreakdown = function( img, analysis, horsedollars ){
        var rendered_template = template({'img': img,
                                          'horsedollars': horsedollars});
        $('.main').append( rendered_template );
        var context = $('.horsechart')[0].getContext("2d");

        var colorhistogram = analysis.colorhistogram;
        var data = [];
        for (var key in colorhistogram) {
            if (colorhistogram.hasOwnProperty(key)) {
                data.push({
                    value:colorhistogram[key], 
                    color:key,
                    label:key,
                    highlight:key,
                });
            }
        }
        var newChart = new Chart(context).Doughnut(data, {});

        $("#modal").click(shoo);
        $("#overlay").click(shoo);

    }

    emitter.on('showBreakdown', showBreakdown);
}

function horseDollaDollaBill(element, emitter){
    var money = 0;

    var payMoney = function(amount){
        console.log("paying money", amount);
        money = money - amount;
        element.html(money);
        emitter.emit('update', money);

    }
    var addMoney = function(amount){
        console.log("adding money", amount);
        money = money + amount;
        element.html(money);
        emitter.emit('update', money);
    }
    var setMoney = function(amount){
        console.log("setmoney", amount);
        money = amount;
        element.html(money);
        emitter.emit('update', money);
    }

    emitter.on('payMoney', payMoney);
    emitter.on('addMoney', addMoney);
    emitter.on('setMoney', setMoney);
}

function stateRunRadio(element, emitter){
    // Save all events that change the page's state. 
    // replay them on page load. 
    var set = function(key,value){
        localStorage[key] = JSON.stringify(value);
    }
    var get = function(key){
        if(localStorage[key] !== undefined){
            return JSON.parse(localStorage[key]);
        }
        else{
            return undefined;
        }
    }

    var updateMoney = function(money){
        set('money', money);
    }
    var addPurchase = function(purchase){
        var purchases = get('purchases');
        if(purchases === undefined){
            purchases = [];
        }
        purchases.push(purchase)
        set('purchases', purchases);
    }
    var addImage = function(img){
        var images = get('images');
        if(images === undefined){
            images = [];
        }
        images.push(img);
        set('images', images);
    }
    var deleteImage = function(url){
        var images = get('images');
        if(images === undefined){
            return;
        }
        // this right here should be an expensive as hell operation
        var urlIndex = images.indexOf(url);
        if( urlIndex > -1 ){
            images.splice(urlIndex, 1);
        }
        set('images', images);
    }
    var reset = function(){
        set('money', 0);
        set('purchases', []);
        set('images', []);
        location.reload();
    }
    
    var loadedMoney = get('money');
    if (loadedMoney !== undefined){
        console.log('setting money:', loadedMoney);
        emitter.emit('setMoney', loadedMoney);
    }
    var loadedPurchases = get('purchases');
    if (loadedPurchases !== undefined){
        $.each(loadedPurchases, function(i, purchase){
            emitter.emit('buyWithoutPaying', purchase);
        });
    }
    var loadedImages = get('images');
    if (loadedImages !== undefined){
        $.each(loadedImages, function(i, image){
            emitter.emit('newImage', image);
        });
    }

    emitter.on('update', updateMoney);
    emitter.on('buy', addPurchase);
    emitter.on('newImage', addImage);
    emitter.on('deleteImage', deleteImage);
    emitter.on('reset', reset);

    element.click(reset);

}



$(function() {
    var emitter = new LucidJS.EventEmitter();
    
    horsecanvas($('.main'), emitter);
    horsecursor($('#horse'), emitter);

    bin($('.left'), emitter);
    currentColor($('.current_color'), emitter);
    colorSelector($('.colors'), emitter);
    stampSelector($('.stamps'), emitter);
    backgroundSelector($('.backgrounds'), emitter);
    stableSelector($('.stables'), emitter);
    storeManager($('.store'), emitter);
    horseDollaDollaBill($('.horsecounter'), emitter);
    chartModal(emitter);
    stateRunRadio($(".reset"), emitter);
    
    emitter.emit("changeSize", 10);
    emitter.emit("setBackground", "images/backgrounds/photoshop.png");

});

