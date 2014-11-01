CodeMirror.defineMode("pascal",function(b){function g(m){var k={},l=m.split(" ");
for(var j=0;
j<l.length;
++j){k[l[j]]=true
}return k
}var c=g("and array begin case const div do downto else end file for forward integer boolean char function goto if in label mod nil not of or packed procedure program record repeat set string then to type until var while with");
var a={"null":true};
var e=/[+\-*&%=<>!?|\/]/;
function h(l,j){var i=l.next();
if(i=="#"&&j.startOfLine){l.skipToEnd();
return"meta"
}if(i=='"'||i=="'"){j.tokenize=f(i);
return j.tokenize(l,j)
}if(i=="("&&l.eat("*")){j.tokenize=d;
return d(l,j)
}if(/[\[\]{}\(\),;\:\.]/.test(i)){return null
}if(/\d/.test(i)){l.eatWhile(/[\w\.]/);
return"number"
}if(i=="/"){if(l.eat("/")){l.skipToEnd();
return"comment"
}}if(e.test(i)){l.eatWhile(e);
return"operator"
}l.eatWhile(/[\w\$_]/);
var k=l.current();
if(c.propertyIsEnumerable(k)){return"keyword"
}if(a.propertyIsEnumerable(k)){return"atom"
}return"variable"
}function f(i){return function(n,l){var m=false,k,j=false;
while((k=n.next())!=null){if(k==i&&!m){j=true;
break
}m=!m&&k=="\\"
}if(j||!m){l.tokenize=null
}return"string"
}
}function d(l,k){var i=false,j;
while(j=l.next()){if(j==")"&&i){k.tokenize=null;
break
}i=(j=="*")
}return"comment"
}return{startState:function(i){return{tokenize:null}
},token:function(k,j){if(k.eatSpace()){return null
}var i=(j.tokenize||h)(k,j);
if(i=="comment"||i=="meta"){return i
}return i
},electricChars:"{}"}
});
CodeMirror.defineMIME("text/x-pascal","pascal");