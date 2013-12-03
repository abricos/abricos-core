YUI.add("aui-tree-view",function(e,t){var n=e.Lang,r=n.isBoolean,i=n.isString,s=e.UA,o="boundingBox",u="children",a="container",f="content",l="contentBox",c=".",h="file",p="hitarea",d="icon",v="invalid",m="label",g="lastSelected",y="leaf",b="node",w="ownerTree",E="root",S="selectOnToggle",x=" ",T="tree",N="tree-node",C="tree-view",k="type",L="view",A=function(){return Array.prototype.slice.call(arguments).join(x)},O=function(t){return t instanceof e.TreeNode},M=e.getClassName,_=M(T,p),D=M(T,d),P=M(T,m),H=M(T,b,f),B=M(T,b,f,v),j=M(T,E,a),F=M(T,L,f),I=e.Component.create({NAME:C,ATTRS:{type:{value:h,validator:i},lastSelected:{value:null,validator:O},lazyLoad:{validator:r,value:!0},selectOnToggle:{validator:r,value:!1}},AUGMENTS:[e.TreeData,e.TreeViewPaginator,e.TreeViewIO],prototype:{CONTENT_TEMPLATE:"<ul></ul>",initializer:function(){var e=this,t=e.get(o);t.setData(C,e)},bindUI:function(){var t=this;t.after("childrenChange",e.bind(t._afterSetChildren,t)),t._delegateDOM()},createNodes:function(t){var n=this;e.Array.each(e.Array(t),function(e){var t=n.createNode(e);n.appendChild(t)}),n._syncPaginatorUI(t)},renderUI:function(){var e=this;e._renderElements()},_afterSetChildren:function(e){var t=this,n=t.get("paginator");if(n&&n.total){var r=-1;e.newVal.length>e.prevVal.length&&(r=1),n.total+=r}t._syncPaginatorUI()},_createFromHTMLMarkup:function(t){var n=this;t.all("> li").each(function(t){var r=t.one("> *").remove(),i=r.outerHTML(),s=t.one("> ul"),o=new e.TreeNode({boundingBox:t,container:s,label:i,leaf:!s,ownerTree:n});s?(o.render(),n._createFromHTMLMarkup(s)):o.render();var u=t.get(it).get(it),a=u.getData(N);e.instanceOf(a,e.TreeNode)||(a=u.getData(C)),a.appendChild(o)})},_createNodeContainer:function(){var e=this,t=e.get(l);return e.set(a,t),t},_renderElements:function(){var e=this,t=e.get(l),n=e.get(u),r=e.get(k),i=M(T,r);t.addClass(F),t.addClass(A(i,j)),n.length||e._createFromHTMLMarkup(t)},_delegateDOM:function(){var t=this,n=t.get(o);n.delegate("click",e.bind(t._onClickNodeEl,t),c+H),n.delegate("dblclick",e.bind(t._onClickHitArea,t),c+D),n.delegate("dblclick",e.bind(t._onClickHitArea,t),c+P),n.delegate("mouseenter",e.bind(t._onMouseEnterNodeEl,t),c+H),n.delegate("mouseleave",e.bind(t._onMouseLeaveNodeEl,t),c+H)},_onClickNodeEl:function(e){var t=this,n=t.getNodeByChild(e.currentTarget);if(n){if(e.target.test(c+_)){n.toggle();if(!t.get(S))return}if(!n.isSelected()){var r=t.get(g);r&&r.unselect(),n.select()}}},_onMouseEnterNodeEl:function(e){var t=this,n=t.getNodeByChild(e.currentTarget);n&&n.over()},_onMouseLeaveNodeEl:function(e){var t=this,n=t.getNodeByChild(e.currentTarget);n&&n.out()},_onClickHitArea:function(e){var t=this,n=t.getNodeByChild(e.currentTarget);n&&n.toggle()}}});e.TreeView=I;var q=n.isNumber,R="above",U="append",z="below",W="block",X="body",V="clearfix",$="default",J="display",K="down",Q="drag",G="draggable",Y="dragCursor",Z="dragNode",et="expanded",tt="helper",nt="insert",rt="offsetHeight",it="parentNode",st="scrollDelay",ot="state",ut="tree-drag-drop",at="up",ft=e.DD.DDM,lt=M(V),ct=M(d),ht=M(T,Q,tt),pt=M(T,Q,tt,f),dt=M(T,Q,tt,m),vt=M(T,Q,nt,R),mt=M(T,Q,nt,U),gt=M(T,Q,nt,z),yt=M(T,Q,ot,U),bt=M(T,Q,ot,nt,R),wt=M(T,Q,ot,nt,z),Et='<div class="'+ht+'">'+'<div class="'+[pt,lt].join(x)+'">'+'<span class="'+ct+'"></span>'+'<span class="'+dt+'"></span>'+"</div>"+"</div>",St=e.Component.create({NAME:ut,ATTRS:{helper:{value:null},scrollDelay:{value:100,validator:q}},EXTENDS:e.TreeView,prototype:{direction:z,dropAction:null,lastY:0,node:null,nodeContent:null,destructor:function(){var e=this,t=e.get(tt);t&&t.remove(!0),e.ddDelegate&&e.ddDelegate.destroy()},bindUI:function(){var t=this;e.TreeViewDD.superclass.bindUI.apply(this,arguments),t._bindDragDrop()},renderUI:function(){var t=this;e.TreeViewDD.superclass.renderUI.apply(this,arguments);var n=e.Node.create(Et).hide();e.one(X).append(n),t.set(tt,n),ft.set(Y,$)},_bindDragDrop:function(){var t=this,n=t.get(o),r=null;t._createDragInitHandler=function(){t.ddDelegate=new e.DD.Delegate({bubbleTargets:t,container:n,invalid:c+B,nodes:c+H,target:!0});var i=t.ddDelegate.dd;i.plug(e.Plugin.DDProxy,{moveOnEnd:!1,positionProxy:!1,borderStyle:null}).plug(e.Plugin.DDNodeScroll,{scrollDelay:t.get(st),node:n}),i.removeInvalid("a"),r&&r.detach()},s.touch?t._createDragInitHandler():r=n.on(["focus","mousedown","mousemove"],t._createDragInitHandler),t.on("drag:align",t._onDragAlign),t.on("drag:start",t._onDragStart),t.on("drop:exit",t._onDropExit),t.after("drop:hit",t._afterDropHit),t.on("drop:hit",t._onDropHit),t.on("drop:over",t._onDropOver)},_appendState:function(e){var t=this;t.dropAction=U,t.get(tt).addClass(yt),e.addClass(mt)},_goingDownState:function(e){var t=this;t.dropAction=z,t.get(tt).addClass(wt),e.addClass(gt)},_goingUpState:function(e){var t=this;t.dropAction=R,t.get(tt).addClass(bt),e.addClass(vt)},_resetState:function(e){var t=this,n=t.get(tt);n.removeClass(yt),n.removeClass(bt),n.removeClass(wt),e&&(e.removeClass(vt),e.removeClass(mt),e.removeClass(gt))},_updateNodeState:function(e){var t=this,n=e.drag,r=e.drop,i=r.get(b),s=i.get(it),o=n.get(b).get(it),u=s.getData(N);t._resetState(t.nodeContent);if(!o.contains(s)){var a=i.get(rt)/3,f=i.getY(),l=f+a,c=f+a*2,h=n.mouseXY[1];h>f&&h<l?t._goingUpState(i):h>c?t._goingDownState(i):h>l&&h<c&&(u&&!u.isLeaf()?t._appendState(i):t.direction===at?t._goingUpState(i):t._goingDownState(i))}t.nodeContent=i},_afterDropHit:function(e){var t=this,n=t.dropAction,r=e.drag.get(b).get(it),i=e.drop.get(b).get(it),s=i.getData(N),o=r.getData(N),u=t.getEventOutputMap(t);u.tree.dropNode=s,u.tree.dragNode=o,n===R?(s.insertBefore(o),t.bubbleEvent("dropInsert",u)):n===z?(s.insertAfter(o),t.bubbleEvent("dropInsert",u)):n===U&&s&&!s.isLeaf()&&(s.get(et)||s.expand(),s.appendChild(o),t.bubbleEvent("dropAppend",u)),t._resetState(t.nodeContent),t.bubbleEvent("drop",u),t.dropAction=null},_onDragAlign:function(e){var t=this,n=t.lastY,r=e.target.lastXY[1];r!==n&&(t.direction=r<n?at:K),t.lastY=r},_onDragStart:function(e){var t=
this,n=e.target,r=n.get(b).get(it),i=r.getData(N),s=t.get(g);s&&s.unselect(),i.select();var o=t.get(tt),u=o.one(c+dt);o.setStyle(J,W).show(),u.html(i.get(m)),n.set(Z,o)},_onDropOver:function(e){var t=this;t._updateNodeState(e)},_onDropHit:function(e){var t=e.drop.get(b).get(it),n=t.getData(N);O(n)||e.preventDefault()},_onDropExit:function(){var e=this;e.dropAction=null,e._resetState(e.nodeContent)}}});e.TreeViewDD=St},"2.0.0",{requires:["dd-delegate","dd-proxy","aui-tree-node","aui-tree-paginator","aui-tree-io"],skinnable:!0});
