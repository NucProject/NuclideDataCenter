
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
    _dataListView: null,

    _alertListView: null,

    __constructor: function() {
    },

    onAttach: function(domNode) {
        this._dataListView = new ListView();
        var dataListViewDomNode = this._dataListView.create();
        dataListViewDomNode.appendTo(domNode.find("div.data-pane"));

        this._alertListView = new ListView();
        var alertListViewDomNode = this._alertListView.create();
        alertListViewDomNode.appendTo(domNode.find("div.alert-pane"));
    },

    fetchData: function() {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/fetch/" + currentStationId + "/" + this._deviceType;
            this._dataListView.refresh(api);
        }
    },

    fetchAlerts: function() {
        var currentStationId = g.getCurrentStationId();
        console.log(33335);
        if (currentStationId)
        {
            console.log(333);
            var api = "data/alerts/" + currentStationId + "/" + this._deviceType;
            this._alertListView.refresh(api);
        }
    }

});

//////////////////////////////////////////////////////////////////////////
// Devices
$class("HpicDevice", DeviceBase,
{
	__constructor: function() {
        this._deviceType = "hpic";
	},

    onAttach: function(domNode) {
        console.log(domNode)
        this.__super(DeviceBase.prototype.onAttach, [domNode]);


        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'battery', 'name':'电池'},
            {'key':'highvoltage', 'name':'电压'},
            {'key':'temperature', 'name':'温度'}]);

        this._alertListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'field', 'name':'字段'},
            {'key':'value', 'name':'值'},
        ]);

    },

    onShow: function()
    {
        //this.fetchData();
        this.fetchAlerts();
    }


});

$class("WeatherDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "weather";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);
        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            ]);
        this.fetchData();
    }
});

$class("HpgeDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpge";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});

$class("LabrDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "labr";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("CinderellaDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "cinderella";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});


$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "environment";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

    }
});



