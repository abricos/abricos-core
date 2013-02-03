YAHOO.namespace("tool");(function(){var A=0;YAHOO.tool.TestCase=function(B){this._should={};for(var C in B){this[C]=B[C];}if(!YAHOO.lang.isString(this.name)){this.name="testCase"+(A++);}};YAHOO.tool.TestCase.prototype={resume:function(B){YAHOO.tool.TestRunner.resume(B);},wait:function(D,C){var B=arguments;if(YAHOO.lang.isFunction(B[0])){throw new YAHOO.tool.TestCase.Wait(B[0],B[1]);}else{throw new YAHOO.tool.TestCase.Wait(function(){YAHOO.util.Assert.fail("Timeout: wait() called but resume() never called.");},(YAHOO.lang.isNumber(B[0])?B[0]:10000));}},setUp:function(){},tearDown:function(){}};YAHOO.tool.TestCase.Wait=function(C,B){this.segment=(YAHOO.lang.isFunction(C)?C:null);this.delay=(YAHOO.lang.isNumber(B)?B:0);};})();YAHOO.namespace("tool");YAHOO.tool.TestSuite=function(A){this.name="";this.items=[];if(YAHOO.lang.isString(A)){this.name=A;}else{if(YAHOO.lang.isObject(A)){YAHOO.lang.augmentObject(this,A,true);}}if(this.name===""){this.name=YAHOO.util.Dom.generateId(null,"testSuite");}};YAHOO.tool.TestSuite.prototype={add:function(A){if(A instanceof YAHOO.tool.TestSuite||A instanceof YAHOO.tool.TestCase){this.items.push(A);}},setUp:function(){},tearDown:function(){}};YAHOO.namespace("tool");YAHOO.tool.TestRunner=(function(){function B(C){this.testObject=C;this.firstChild=null;this.lastChild=null;this.parent=null;this.next=null;this.results={passed:0,failed:0,total:0,ignored:0,duration:0};if(C instanceof YAHOO.tool.TestSuite){this.results.type="testsuite";this.results.name=C.name;}else{if(C instanceof YAHOO.tool.TestCase){this.results.type="testcase";this.results.name=C.name;}}}B.prototype={appendChild:function(C){var D=new B(C);if(this.firstChild===null){this.firstChild=this.lastChild=D;}else{this.lastChild.next=D;this.lastChild=D;}D.parent=this;return D;}};function A(){A.superclass.constructor.apply(this,arguments);this.masterSuite=new YAHOO.tool.TestSuite("yuitests"+(new Date()).getTime());this._cur=null;this._root=null;this._running=false;this._lastResults=null;var D=[this.TEST_CASE_BEGIN_EVENT,this.TEST_CASE_COMPLETE_EVENT,this.TEST_SUITE_BEGIN_EVENT,this.TEST_SUITE_COMPLETE_EVENT,this.TEST_PASS_EVENT,this.TEST_FAIL_EVENT,this.TEST_IGNORE_EVENT,this.COMPLETE_EVENT,this.BEGIN_EVENT];for(var C=0;C<D.length;C++){this.createEvent(D[C],{scope:this});}}YAHOO.lang.extend(A,YAHOO.util.EventProvider,{TEST_CASE_BEGIN_EVENT:"testcasebegin",TEST_CASE_COMPLETE_EVENT:"testcasecomplete",TEST_SUITE_BEGIN_EVENT:"testsuitebegin",TEST_SUITE_COMPLETE_EVENT:"testsuitecomplete",TEST_PASS_EVENT:"pass",TEST_FAIL_EVENT:"fail",TEST_IGNORE_EVENT:"ignore",COMPLETE_EVENT:"complete",BEGIN_EVENT:"begin",getName:function(){return this.masterSuite.name;},setName:function(C){this.masterSuite.name=C;},isRunning:function(){return this._running;},getResults:function(C){if(!this._running&&this._lastResults){if(YAHOO.lang.isFunction(C)){return C(this._lastResults);}else{return this._lastResults;}}else{return null;}},getCoverage:function(C){if(!this._running&&typeof _yuitest_coverage=="object"){if(YAHOO.lang.isFunction(C)){return C(_yuitest_coverage);}else{return _yuitest_coverage;}}else{return null;}},getName:function(){return this.masterSuite.name;},setName:function(C){this.masterSuite.name=C;},_addTestCaseToTestTree:function(C,D){var E=C.appendChild(D);for(var F in D){if(F.indexOf("test")===0&&YAHOO.lang.isFunction(D[F])){E.appendChild(F);}}},_addTestSuiteToTestTree:function(C,F){var E=C.appendChild(F);for(var D=0;D<F.items.length;D++){if(F.items[D] instanceof YAHOO.tool.TestSuite){this._addTestSuiteToTestTree(E,F.items[D]);}else{if(F.items[D] instanceof YAHOO.tool.TestCase){this._addTestCaseToTestTree(E,F.items[D]);}}}},_buildTestTree:function(){this._root=new B(this.masterSuite);for(var C=0;C<this.masterSuite.items.length;C++){if(this.masterSuite.items[C] instanceof YAHOO.tool.TestSuite){this._addTestSuiteToTestTree(this._root,this.masterSuite.items[C]);}else{if(this.masterSuite.items[C] instanceof YAHOO.tool.TestCase){this._addTestCaseToTestTree(this._root,this.masterSuite.items[C]);}}}},_handleTestObjectComplete:function(C){if(YAHOO.lang.isObject(C.testObject)){C.parent.results.passed+=C.results.passed;C.parent.results.failed+=C.results.failed;C.parent.results.total+=C.results.total;C.parent.results.ignored+=C.results.ignored;C.parent.results[C.testObject.name]=C.results;if(C.testObject instanceof YAHOO.tool.TestSuite){C.testObject.tearDown();C.results.duration=(new Date())-C._start;this.fireEvent(this.TEST_SUITE_COMPLETE_EVENT,{testSuite:C.testObject,results:C.results});}else{if(C.testObject instanceof YAHOO.tool.TestCase){C.results.duration=(new Date())-C._start;this.fireEvent(this.TEST_CASE_COMPLETE_EVENT,{testCase:C.testObject,results:C.results});}}}},_next:function(){if(this._cur===null){this._cur=this._root;}else{if(this._cur.firstChild){this._cur=this._cur.firstChild;}else{if(this._cur.next){this._cur=this._cur.next;}else{while(this._cur&&!this._cur.next&&this._cur!==this._root){this._handleTestObjectComplete(this._cur);this._cur=this._cur.parent;}if(this._cur==this._root){this._cur.results.type="report";this._cur.results.timestamp=(new Date()).toLocaleString();this._cur.results.duration=(new Date())-this._cur._start;this._lastResults=this._cur.results;this._running=false;this.fireEvent(this.COMPLETE_EVENT,{results:this._lastResults});this._cur=null;}else{this._handleTestObjectComplete(this._cur);this._cur=this._cur.next;}}}}return this._cur;},_run:function(){var E=false;var D=this._next();if(D!==null){this._running=true;this._lastResult=null;var C=D.testObject;if(YAHOO.lang.isObject(C)){if(C instanceof YAHOO.tool.TestSuite){this.fireEvent(this.TEST_SUITE_BEGIN_EVENT,{testSuite:C});D._start=new Date();C.setUp();}else{if(C instanceof YAHOO.tool.TestCase){this.fireEvent(this.TEST_CASE_BEGIN_EVENT,{testCase:C});D._start=new Date();}}if(typeof setTimeout!="undefined"){setTimeout(function(){YAHOO.tool.TestRunner._run();},0);}else{this._run();}}else{this._runTest(D);}}},_resumeTest:function(H){var C=this._cur;var I=C.testObject;
var F=C.parent.testObject;if(F.__yui_wait){clearTimeout(F.__yui_wait);delete F.__yui_wait;}var L=(F._should.fail||{})[I];var D=(F._should.error||{})[I];var G=false;var J=null;try{H.apply(F);if(L){J=new YAHOO.util.ShouldFail();G=true;}else{if(D){J=new YAHOO.util.ShouldError();G=true;}}}catch(K){if(K instanceof YAHOO.util.AssertionError){if(!L){J=K;G=true;}}else{if(K instanceof YAHOO.tool.TestCase.Wait){if(YAHOO.lang.isFunction(K.segment)){if(YAHOO.lang.isNumber(K.delay)){if(typeof setTimeout!="undefined"){F.__yui_wait=setTimeout(function(){YAHOO.tool.TestRunner._resumeTest(K.segment);},K.delay);}else{throw new Error("Asynchronous tests not supported in this environment.");}}}return;}else{if(!D){J=new YAHOO.util.UnexpectedError(K);G=true;}else{if(YAHOO.lang.isString(D)){if(K.message!=D){J=new YAHOO.util.UnexpectedError(K);G=true;}}else{if(YAHOO.lang.isFunction(D)){if(!(K instanceof D)){J=new YAHOO.util.UnexpectedError(K);G=true;}}else{if(YAHOO.lang.isObject(D)){if(!(K instanceof D.constructor)||K.message!=D.message){J=new YAHOO.util.UnexpectedError(K);G=true;}}}}}}}}if(G){this.fireEvent(this.TEST_FAIL_EVENT,{testCase:F,testName:I,error:J});}else{this.fireEvent(this.TEST_PASS_EVENT,{testCase:F,testName:I});}F.tearDown();var E=(new Date())-C._start;C.parent.results[I]={result:G?"fail":"pass",message:J?J.getMessage():"Test passed",type:"test",name:I,duration:E};if(G){C.parent.results.failed++;}else{C.parent.results.passed++;}C.parent.results.total++;if(typeof setTimeout!="undefined"){setTimeout(function(){YAHOO.tool.TestRunner._run();},0);}else{this._run();}},_runTest:function(F){var C=F.testObject;var D=F.parent.testObject;var G=D[C];var E=(D._should.ignore||{})[C];if(E){F.parent.results[C]={result:"ignore",message:"Test ignored",type:"test",name:C};F.parent.results.ignored++;F.parent.results.total++;this.fireEvent(this.TEST_IGNORE_EVENT,{testCase:D,testName:C});if(typeof setTimeout!="undefined"){setTimeout(function(){YAHOO.tool.TestRunner._run();},0);}else{this._run();}}else{F._start=new Date();D.setUp();this._resumeTest(G);}},fireEvent:function(C,D){D=D||{};D.type=C;A.superclass.fireEvent.call(this,C,D);},add:function(C){this.masterSuite.add(C);},clear:function(){this.masterSuite=new YAHOO.tool.TestSuite("yuitests"+(new Date()).getTime());},resume:function(C){this._resumeTest(C||function(){});},run:function(C){var D=YAHOO.tool.TestRunner;if(!C&&this.masterSuite.items.length==1&&this.masterSuite.items[0] instanceof YAHOO.tool.TestSuite){this.masterSuite=this.masterSuite.items[0];}D._buildTestTree();D._root._start=new Date();D.fireEvent(D.BEGIN_EVENT);D._run();}});return new A();})();YAHOO.namespace("util");YAHOO.util.Assert={_formatMessage:function(B,A){var C=B;if(YAHOO.lang.isString(B)&&B.length>0){return YAHOO.lang.substitute(B,{message:A});}else{return A;}},fail:function(A){throw new YAHOO.util.AssertionError(this._formatMessage(A,"Test force-failed."));},areEqual:function(B,C,A){if(B!=C){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Values should be equal."),B,C);}},areNotEqual:function(A,C,B){if(A==C){throw new YAHOO.util.UnexpectedValue(this._formatMessage(B,"Values should not be equal."),A);}},areNotSame:function(A,C,B){if(A===C){throw new YAHOO.util.UnexpectedValue(this._formatMessage(B,"Values should not be the same."),A);}},areSame:function(B,C,A){if(B!==C){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Values should be the same."),B,C);}},isFalse:function(B,A){if(false!==B){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be false."),false,B);}},isTrue:function(B,A){if(true!==B){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be true."),true,B);}},isNaN:function(B,A){if(!isNaN(B)){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be NaN."),NaN,B);}},isNotNaN:function(B,A){if(isNaN(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Values should not be NaN."),NaN);}},isNotNull:function(B,A){if(YAHOO.lang.isNull(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Values should not be null."),null);}},isNotUndefined:function(B,A){if(YAHOO.lang.isUndefined(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should not be undefined."),undefined);}},isNull:function(B,A){if(!YAHOO.lang.isNull(B)){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be null."),null,B);}},isUndefined:function(B,A){if(!YAHOO.lang.isUndefined(B)){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be undefined."),undefined,B);}},isArray:function(B,A){if(!YAHOO.lang.isArray(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be an array."),B);}},isBoolean:function(B,A){if(!YAHOO.lang.isBoolean(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be a Boolean."),B);}},isFunction:function(B,A){if(!YAHOO.lang.isFunction(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be a function."),B);}},isInstanceOf:function(B,C,A){if(!(C instanceof B)){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value isn't an instance of expected type."),B,C);}},isNumber:function(B,A){if(!YAHOO.lang.isNumber(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be a number."),B);}},isObject:function(B,A){if(!YAHOO.lang.isObject(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be an object."),B);}},isString:function(B,A){if(!YAHOO.lang.isString(B)){throw new YAHOO.util.UnexpectedValue(this._formatMessage(A,"Value should be a string."),B);}},isTypeOf:function(B,C,A){if(typeof C!=B){throw new YAHOO.util.ComparisonFailure(this._formatMessage(A,"Value should be of type "+B+"."),B,typeof C);}}};YAHOO.util.AssertionError=function(A){this.message=A;this.name="AssertionError";};YAHOO.lang.extend(YAHOO.util.AssertionError,Object,{getMessage:function(){return this.message;},toString:function(){return this.name+": "+this.getMessage();
}});YAHOO.util.ComparisonFailure=function(B,A,C){YAHOO.util.AssertionError.call(this,B);this.expected=A;this.actual=C;this.name="ComparisonFailure";};YAHOO.lang.extend(YAHOO.util.ComparisonFailure,YAHOO.util.AssertionError,{getMessage:function(){return this.message+"\nExpected: "+this.expected+" ("+(typeof this.expected)+")"+"\nActual:"+this.actual+" ("+(typeof this.actual)+")";}});YAHOO.util.UnexpectedValue=function(B,A){YAHOO.util.AssertionError.call(this,B);this.unexpected=A;this.name="UnexpectedValue";};YAHOO.lang.extend(YAHOO.util.UnexpectedValue,YAHOO.util.AssertionError,{getMessage:function(){return this.message+"\nUnexpected: "+this.unexpected+" ("+(typeof this.unexpected)+") ";}});YAHOO.util.ShouldFail=function(A){YAHOO.util.AssertionError.call(this,A||"This test should fail but didn't.");this.name="ShouldFail";};YAHOO.lang.extend(YAHOO.util.ShouldFail,YAHOO.util.AssertionError);YAHOO.util.ShouldError=function(A){YAHOO.util.AssertionError.call(this,A||"This test should have thrown an error but didn't.");this.name="ShouldError";};YAHOO.lang.extend(YAHOO.util.ShouldError,YAHOO.util.AssertionError);YAHOO.util.UnexpectedError=function(A){YAHOO.util.AssertionError.call(this,"Unexpected error: "+A.message);this.cause=A;this.name="UnexpectedError";this.stack=A.stack;};YAHOO.lang.extend(YAHOO.util.UnexpectedError,YAHOO.util.AssertionError);YAHOO.util.ArrayAssert={contains:function(E,D,B){var C=false;var F=YAHOO.util.Assert;for(var A=0;A<D.length&&!C;A++){if(D[A]===E){C=true;}}if(!C){F.fail(F._formatMessage(B,"Value "+E+" ("+(typeof E)+") not found in array ["+D+"]."));}},containsItems:function(C,D,B){for(var A=0;A<C.length;A++){this.contains(C[A],D,B);}},containsMatch:function(E,D,B){if(typeof E!="function"){throw new TypeError("ArrayAssert.containsMatch(): First argument must be a function.");}var C=false;var F=YAHOO.util.Assert;for(var A=0;A<D.length&&!C;A++){if(E(D[A])){C=true;}}if(!C){F.fail(F._formatMessage(B,"No match found in array ["+D+"]."));}},doesNotContain:function(E,D,B){var C=false;var F=YAHOO.util.Assert;for(var A=0;A<D.length&&!C;A++){if(D[A]===E){C=true;}}if(C){F.fail(F._formatMessage(B,"Value found in array ["+D+"]."));}},doesNotContainItems:function(C,D,B){for(var A=0;A<C.length;A++){this.doesNotContain(C[A],D,B);}},doesNotContainMatch:function(E,D,B){if(typeof E!="function"){throw new TypeError("ArrayAssert.doesNotContainMatch(): First argument must be a function.");}var C=false;var F=YAHOO.util.Assert;for(var A=0;A<D.length&&!C;A++){if(E(D[A])){C=true;}}if(C){F.fail(F._formatMessage(B,"Value found in array ["+D+"]."));}},indexOf:function(E,D,A,C){for(var B=0;B<D.length;B++){if(D[B]===E){YAHOO.util.Assert.areEqual(A,B,C||"Value exists at index "+B+" but should be at index "+A+".");return;}}var F=YAHOO.util.Assert;F.fail(F._formatMessage(C,"Value doesn't exist in array ["+D+"]."));},itemsAreEqual:function(D,F,C){var A=Math.max(D.length,F.length||0);var E=YAHOO.util.Assert;for(var B=0;B<A;B++){E.areEqual(D[B],F[B],E._formatMessage(C,"Values in position "+B+" are not equal."));}},itemsAreEquivalent:function(E,F,B,D){if(typeof B!="function"){throw new TypeError("ArrayAssert.itemsAreEquivalent(): Third argument must be a function.");}var A=Math.max(E.length,F.length||0);for(var C=0;C<A;C++){if(!B(E[C],F[C])){throw new YAHOO.util.ComparisonFailure(YAHOO.util.Assert._formatMessage(D,"Values in position "+C+" are not equivalent."),E[C],F[C]);}}},isEmpty:function(C,A){if(C.length>0){var B=YAHOO.util.Assert;B.fail(B._formatMessage(A,"Array should be empty."));}},isNotEmpty:function(C,A){if(C.length===0){var B=YAHOO.util.Assert;B.fail(B._formatMessage(A,"Array should not be empty."));}},itemsAreSame:function(D,F,C){var A=Math.max(D.length,F.length||0);var E=YAHOO.util.Assert;for(var B=0;B<A;B++){E.areSame(D[B],F[B],E._formatMessage(C,"Values in position "+B+" are not the same."));}},lastIndexOf:function(E,D,A,C){var F=YAHOO.util.Assert;for(var B=D.length;B>=0;B--){if(D[B]===E){F.areEqual(A,B,F._formatMessage(C,"Value exists at index "+B+" but should be at index "+A+"."));return;}}F.fail(F._formatMessage(C,"Value doesn't exist in array."));}};YAHOO.namespace("util");YAHOO.util.ObjectAssert={propertiesAreEqual:function(D,G,C){var F=YAHOO.util.Assert;var B=[];for(var E in D){B.push(E);}for(var A=0;A<B.length;A++){F.isNotUndefined(G[B[A]],F._formatMessage(C,"Property '"+B[A]+"' expected."));}},hasProperty:function(A,B,C){if(!(A in B)){var D=YAHOO.util.Assert;D.fail(D._formatMessage(C,"Property '"+A+"' not found on object."));}},hasOwnProperty:function(A,B,C){if(!YAHOO.lang.hasOwnProperty(B,A)){var D=YAHOO.util.Assert;D.fail(D._formatMessage(C,"Property '"+A+"' not found on object instance."));}}};YAHOO.util.DateAssert={datesAreEqual:function(B,D,A){if(B instanceof Date&&D instanceof Date){var C=YAHOO.util.Assert;C.areEqual(B.getFullYear(),D.getFullYear(),C._formatMessage(A,"Years should be equal."));C.areEqual(B.getMonth(),D.getMonth(),C._formatMessage(A,"Months should be equal."));C.areEqual(B.getDate(),D.getDate(),C._formatMessage(A,"Day of month should be equal."));}else{throw new TypeError("DateAssert.datesAreEqual(): Expected and actual values must be Date objects.");}},timesAreEqual:function(B,D,A){if(B instanceof Date&&D instanceof Date){var C=YAHOO.util.Assert;C.areEqual(B.getHours(),D.getHours(),C._formatMessage(A,"Hours should be equal."));C.areEqual(B.getMinutes(),D.getMinutes(),C._formatMessage(A,"Minutes should be equal."));C.areEqual(B.getSeconds(),D.getSeconds(),C._formatMessage(A,"Seconds should be equal."));}else{throw new TypeError("DateAssert.timesAreEqual(): Expected and actual values must be Date objects.");}}};YUITest={TestRunner:YAHOO.tool.TestRunner,ResultsFormat:YAHOO.tool.TestFormat,CoverageFormat:YAHOO.tool.CoverageFormat};YAHOO.register("yuitest_core",YAHOO.tool.TestRunner,{version:"@VERSION@",build:"@BUILD@"});