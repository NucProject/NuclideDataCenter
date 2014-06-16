
//////////////////////////////////////////////////////////////////////////
// Device Table Pane
$class("DeviceTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{

	__constructor: function(secret) {

    },

	onAttach: function(domNode) {

        kx.activeWeb(domNode);

	}

});
//////////////////////////////////////////////////////////////////////////
// Devices Base
$class("DeviceBase", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _listView: null,

    __constructor: function() {
    },

    onAttach: function(domNode) {
        this._listView = new ListView();
        var listViewDomNode = this._listView.create();

        listViewDomNode.appendTo(domNode.find("div.list-pane"));
    },

    refresh: function() {
    }

});

//////////////////////////////////////////////////////////////////////////
// Devices
$class("HpicDevice", DeviceBase,
{
	__constructor: function() {

	},

    onAttach: function(domNode) {
        console.log(domNode)
        this.__super(DeviceBase.prototype.onAttach, [domNode]);


        this._listView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'battery', 'name':'电池'},
            {'key':'highvoltage', 'name':'电压'},
            {'key':'temperature', 'name':'温度'}]);

        this.refresh();
    },

    refresh: function() {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/fetch/" + currentStationId + "/hpic";
            this._listView.refresh(api);
        }
    }
});

$class("WeatherDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});

$class("HpgeDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});

$class("LabrDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("CinderellaDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});



