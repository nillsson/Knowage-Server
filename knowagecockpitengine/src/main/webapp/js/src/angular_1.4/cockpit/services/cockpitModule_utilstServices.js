angular.module("cockpitModule").service("cockpitModule_utilstServices",function(cockpitModule_analyticalDrivers){
	var ut=this;

	this.getParameterValue=function(textVal){
		if(textVal!=undefined){
			var adVal=angular.copy(textVal);
			if(angular.isString(adVal)){
				angular.forEach(cockpitModule_analyticalDrivers,function(val,item){
					var valRegExp = new RegExp('\\{;\\{(.*)\\}(.*)\\}');
					if(angular.isString(val) && valRegExp.test(val)){
						var matches = val.match(valRegExp);
						var elements = matches[1].split(";");
						var type = matches[2];
						var delimiter = (type == "STRING") ? "'" : "";
						var strings = [];
						angular.forEach(elements,function(value){
							this.push(delimiter + value + delimiter);
						},strings);
						val = strings.join(",");
					}
					var reg = new RegExp('\\$P\\{('+item+')\\}','g');
					adVal=adVal.replace(reg, val);
				})
				var reg2 = new RegExp('\\$P\\{[^\\}]*\\}','g');
				adVal=adVal.replace(reg2, "");
			}


			return adVal;
		}
	}

	this.getDriverArray=function(textVal){
		if(textVal!=undefined){
			var rightArray = [];
			var adVal=angular.copy(textVal);
			if(angular.isString(adVal)){
				angular.forEach(cockpitModule_analyticalDrivers,function(val,item){
					var valRegExp = new RegExp('\\{;\\{(.*)\\}(.*)\\}');
					if(angular.isString(val) && valRegExp.test(val)) {
						var matches = val.match(valRegExp);
						var elements = matches[1].split(";");
						rightArray = elements;
					}
					var reg = new RegExp('\\$P\\{('+item+')\\}','g');
					adVal=adVal.replace(reg, val);
				})
			}
			return rightArray;
		}
	}
});

