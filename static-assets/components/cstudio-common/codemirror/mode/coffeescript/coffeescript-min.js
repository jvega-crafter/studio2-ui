CodeMirror.defineMode("coffeescript",function(l){var b="error";
function q(z){return new RegExp("^(("+z.join(")|(")+"))\\b")
}var p=new RegExp("^[\\+\\-\\*/%&|\\^~<>!?]");
var r=new RegExp("^[\\(\\)\\[\\]\\{\\},:`=;\\.]");
var a=new RegExp("^((->)|(=>)|(\\+\\+)|(\\+\\=)|(\\-\\-)|(\\-\\=)|(\\*\\*)|(\\*\\=)|(\\/\\/)|(\\/\\=)|(==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//))");
var j=new RegExp("^((\\.\\.)|(\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
var v=new RegExp("^((\\.\\.\\.)|(//=)|(>>=)|(<<=)|(\\*\\*=))");
var g=new RegExp("^[_A-Za-z$][_A-Za-z$0-9]*");
var i=new RegExp("^(@|this.)[_A-Za-z$][_A-Za-z$0-9]*");
var d=q(["and","or","not","is","isnt","in","instanceof","typeof"]);
var c=["for","while","loop","if","unless","else","switch","try","catch","finally","class"];
var t=["break","by","continue","debugger","delete","do","in","of","new","return","then","this","throw","when","until"];
var k=q(c.concat(t));
c=q(c);
var m=new RegExp("^('{3}|\"{3}|['\"])");
var h=new RegExp("^(/{3}|/)");
var n=["Infinity","NaN","undefined","null","true","false","on","off","yes","no"];
var y=q(n);
function x(F,E){if(F.sol()){var A=E.scopes[0].offset;
if(F.eatSpace()){var C=F.indentation();
if(C>A){return"indent"
}else{if(C<A){return"dedent"
}}return null
}else{if(A>0){e(F,E)
}}}if(F.eatSpace()){return null
}var D=F.peek();
if(F.match("####")){F.skipToEnd();
return"comment"
}if(F.match("###")){E.tokenize=s;
return E.tokenize(F,E)
}if(D==="#"){F.skipToEnd();
return"comment"
}if(F.match(/^-?[0-9\.]/,false)){var B=false;
if(F.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)){B=true
}if(F.match(/^-?\d+\.\d*/)){B=true
}if(F.match(/^-?\.\d+/)){B=true
}if(B){if(F.peek()=="."){F.backUp(1)
}return"number"
}var z=false;
if(F.match(/^-?0x[0-9a-f]+/i)){z=true
}if(F.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)){z=true
}if(F.match(/^-?0(?![\dx])/i)){z=true
}if(z){return"number"
}}if(F.match(m)){E.tokenize=u(F.current(),"string");
return E.tokenize(F,E)
}if(F.match(h)){if(F.current()!="/"||F.match(/^.*\//,false)){E.tokenize=u(F.current(),"string-2");
return E.tokenize(F,E)
}else{F.backUp(1)
}}if(F.match(v)||F.match(j)){return"punctuation"
}if(F.match(a)||F.match(p)||F.match(d)){return"operator"
}if(F.match(r)){return"punctuation"
}if(F.match(y)){return"atom"
}if(F.match(k)){return"keyword"
}if(F.match(g)){return"variable"
}if(F.match(i)){return"property"
}F.next();
return b
}function u(z,C){var A=z.length==1;
return function B(E,D){while(!E.eol()){E.eatWhile(/[^'"\/\\]/);
if(E.eat("\\")){E.next();
if(A&&E.eol()){return C
}}else{if(E.match(z)){D.tokenize=x;
return C
}else{E.eat(/['"\/]/)
}}}if(A){if(l.mode.singleLineStringErrors){C=b
}else{D.tokenize=x
}}return C
}
}function s(A,z){while(!A.eol()){A.eatWhile(/[^#]/);
if(A.match("###")){z.tokenize=x;
break
}A.eatWhile("#")
}return"comment"
}function o(D,C,B){B=B||"coffee";
var z=0;
if(B==="coffee"){for(var A=0;
A<C.scopes.length;
A++){if(C.scopes[A].type==="coffee"){z=C.scopes[A].offset+l.indentUnit;
break
}}}else{z=D.column()+D.current().length
}C.scopes.unshift({offset:z,type:B})
}function e(D,C){if(C.scopes.length==1){return
}if(C.scopes[0].type==="coffee"){var A=D.indentation();
var B=-1;
for(var z=0;
z<C.scopes.length;
++z){if(A===C.scopes[z].offset){B=z;
break
}}if(B===-1){return true
}while(C.scopes[0].offset!==A){C.scopes.shift()
}return false
}else{C.scopes.shift();
return false
}}function w(D,B){var A=B.tokenize(D,B);
var C=D.current();
if(C==="."){A=B.tokenize(D,B);
C=D.current();
if(A==="variable"){return"variable"
}else{return b
}}if(C==="return"){B.dedent+=1
}if(((C==="->"||C==="=>")&&!B.lambda&&B.scopes[0].type=="coffee"&&D.peek()==="")||A==="indent"){o(D,B)
}var z="[({".indexOf(C);
if(z!==-1){o(D,B,"])}".slice(z,z+1))
}if(c.exec(C)){o(D,B)
}if(C=="then"){e(D,B)
}if(A==="dedent"){if(e(D,B)){return b
}}z="])}".indexOf(C);
if(z!==-1){if(e(D,B)){return b
}}if(B.dedent>0&&D.eol()&&B.scopes[0].type=="coffee"){if(B.scopes.length>1){B.scopes.shift()
}B.dedent-=1
}return A
}var f={startState:function(z){return{tokenize:x,scopes:[{offset:z||0,type:"coffee"}],lastToken:null,lambda:false,dedent:0}
},token:function(B,A){var z=w(B,A);
A.lastToken={style:z,content:B.current()};
if(B.eol()&&B.lambda){A.lambda=false
}return z
},indent:function(A,z){if(A.tokenize!=x){return 0
}return A.scopes[0].offset
}};
return f
});
CodeMirror.defineMIME("text/x-coffeescript","coffeescript");