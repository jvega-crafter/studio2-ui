(function(a){a.fn.extend({simulate:function(c,b){return this.each(function(){var d=a.extend({},a.simulate.defaults,b||{});
new a.simulate(this,c,d)
})
}});
a.simulate=function(d,c,b){this.target=d;
this.options=b;
if(/^drag$/.test(c)){this[c].apply(this,[this.target,b])
}else{this.simulateEvent(d,c,b)
}};
a.extend(a.simulate.prototype,{simulateEvent:function(e,d,c){var b=this.createEvent(d,c);
this.dispatchEvent(e,d,b,c);
return b
},createEvent:function(c,b){if(/^mouse(over|out|down|up|move)|(dbl)?click$/.test(c)){return this.mouseEvent(c,b)
}else{if(/^key(up|down|press)$/.test(c)){return this.keyboardEvent(c,b)
}}},mouseEvent:function(f,d){var c;
var g=a.extend({bubbles:true,cancelable:(f!="mousemove"),view:window,detail:0,screenX:0,screenY:0,clientX:0,clientY:0,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,button:0,relatedTarget:undefined},d);
var b=a(g.relatedTarget)[0];
if(a.isFunction(document.createEvent)){c=document.createEvent("MouseEvents");
c.initMouseEvent(f,g.bubbles,g.cancelable,g.view,g.detail,g.screenX,g.screenY,g.clientX,g.clientY,g.ctrlKey,g.altKey,g.shiftKey,g.metaKey,g.button,g.relatedTarget||document.body.parentNode)
}else{if(document.createEventObject){c=document.createEventObject();
a.extend(c,g);
c.button={0:1,1:4,2:2}[c.button]||c.button
}}return c
},keyboardEvent:function(d,c){var b;
var g=a.extend({bubbles:true,cancelable:true,view:window,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,keyCode:0,charCode:0},c);
if(a.isFunction(document.createEvent)){try{b=document.createEvent("KeyEvents");
b.initKeyEvent(d,g.bubbles,g.cancelable,g.view,g.ctrlKey,g.altKey,g.shiftKey,g.metaKey,g.keyCode,g.charCode)
}catch(f){b=document.createEvent("Events");
b.initEvent(d,g.bubbles,g.cancelable);
a.extend(b,{view:g.view,ctrlKey:g.ctrlKey,altKey:g.altKey,shiftKey:g.shiftKey,metaKey:g.metaKey,keyCode:g.keyCode,charCode:g.charCode})
}}else{if(document.createEventObject){b=document.createEventObject();
a.extend(b,g)
}}if(a.browser.msie||a.browser.opera){b.keyCode=(g.charCode>0)?g.charCode:g.keyCode;
b.charCode=undefined
}return b
},dispatchEvent:function(d,c,b){if(d.dispatchEvent){d.dispatchEvent(b)
}else{if(d.fireEvent){d.fireEvent("on"+c,b)
}}return b
},drag:function(c){var h=this,b=this.findCenter(this.target),j=this.options,g=Math.floor(b.x),f=Math.floor(b.y),k=j.dx||0,i=j.dy||0,e=this.target;
var d={clientX:g,clientY:f};
this.simulateEvent(e,"mousedown",d);
d={clientX:g+1,clientY:f+1};
this.simulateEvent(document,"mousemove",d);
d={clientX:g+k,clientY:f+i};
this.simulateEvent(document,"mousemove",d);
this.simulateEvent(document,"mousemove",d);
this.simulateEvent(e,"mouseup",d)
},findCenter:function(b){var b=a(this.target),c=b.offset();
return{x:c.left+b.outerWidth()/2,y:c.top+b.outerHeight()/2}
}});
a.extend(a.simulate,{defaults:{speed:"sync"},VK_TAB:9,VK_ENTER:13,VK_ESC:27,VK_PGUP:33,VK_PGDN:34,VK_END:35,VK_HOME:36,VK_LEFT:37,VK_UP:38,VK_RIGHT:39,VK_DOWN:40})
})(jQuery);