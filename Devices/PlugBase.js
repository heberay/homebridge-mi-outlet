require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

PlugBase = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    this.device = new miio.Device({
        address: this.config['ip'],
        token: this.config['token']
    });
    
    this.accessories = {};
    if(!this.config['outletDisable'] && this.config['outletName'] && this.config['outletName'] != "") {
        this.accessories['outletAccessory'] = new PlugBaseOutlet(this);
    }
    if(!this.config['temperatureDisable'] && this.config['temperatureName'] && this.config['temperatureName'] != "") {
        this.accessories['temperatureAccessory'] = new PlugBaseTemperature(this);
    }
    if(!this.config['switchLEDDisable'] && this.config['switchLEDName'] && this.config['switchLEDName'] != "") {
        this.accessories['switchLEDAccessory'] = new PlugBaseSwitchLED(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiOutletPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(PlugBase, Base);

PlugBaseOutlet = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['outletName'];
    this.platform = dThis.platform;
}

PlugBaseOutlet.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Plug Base")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var outletService = new Service.Outlet(this.name);
    outletService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getPower.bind(this))
        .on('set', this.setPower.bind(this));
    outletService
        .getCharacteristic(Characteristic.OutletInUse)
        .on('get', this.getOutletInUse.bind(this));
    services.push(outletService);

    return services;
}

PlugBaseOutlet.prototype.getOutletInUse = function(callback) {
    var that = this;
    this.device.call("get_prop", ["power"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - Outlet - getOutletInUse: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - Outlet - getOutletInUse Error: " + err);
        callback(err);
    });
}

PlugBaseOutlet.prototype.getPower = function(callback) {
    var that = this;
    this.device.call("get_prop", ["power"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - Outlet - getPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - Outlet - getPower Error: " + err);
        callback(err);
    });
}

PlugBaseOutlet.prototype.setPower = function(value, callback) {
    var that = this;
    that.device.call("set_power", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - Outlet - setPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - Outlet - setPower Error: " + err);
        callback(err);
    });
}

PlugBaseTemperature = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['temperatureName'];
    this.platform = dThis.platform;
}

PlugBaseTemperature.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Plug Base")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var temperatureService = new Service.TemperatureSensor(this.name);
    temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this))
    services.push(temperatureService);

    return services;
}

PlugBaseTemperature.prototype.getTemperature = function(callback) {
    var that = this;
    this.device.call("get_prop", ["temperature"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - Temperature - getTemperature: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - Temperature - getTemperature Error: " + err);
        callback(err);
    });
}

PlugBaseSwitchLED = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['switchLEDName'];
    this.platform = dThis.platform;
}

PlugBaseSwitchLED.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Plug Base")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var switchLEDService = new Service.Lightbulb(this.name);
    switchLEDService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getLEDPower.bind(this))
        .on('set', this.setLEDPower.bind(this));
    services.push(switchLEDService);

    return services;
}

PlugBaseSwitchLED.prototype.getLEDPower = function(callback) {
    var that = this;
    this.device.call("get_prop", ["wifi_led"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - SwitchLED - getLEDPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - SwitchLED - getLEDPower Error: " + err);
        callback(err);
    });
}

PlugBaseSwitchLED.prototype.setLEDPower = function(value, callback) {
    var that = this;
    that.device.call("set_wifi_led", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiOutletPlatform][DEBUG]PlugBase - SwitchLED - setLEDPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiOutletPlatform][ERROR]PlugBase - SwitchLED - setLEDPower Error: " + err);
        callback(err);
    });
}