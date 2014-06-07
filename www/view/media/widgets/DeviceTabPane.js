
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
        console.log(domNode)
        this._listView = new ListView();
        var listViewDomNode = this._listView.create();

        listViewDomNode.appendTo(domNode.find("div.list-pane"));
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


        this._listView.setHeaders([]);

        this.refresh();
    },

    refresh: function() {
        var currentStation = 128;
        var api = "data/fetch/" + currentStation + "/hpic";
        this._listView.refresh(api);
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

$class("LabrDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("CinderellaDataDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("CinderellaStatusDevice", DeviceBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


