/**
 * Created by Healer on 14-9-9.
 */


$class("GamaSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "gama";
        this.onAttached(domNode);
    },

    onSettingPaneShow: function(fieldConfig)
    {
        console.log(fieldConfig);
        for (var i in fieldConfig)
        {
            console.log(i, fieldConfig[i]);
        }
    },

    changeAlertClicked: function()
    {
        var url = "alert/set/" + g.getCurrentStationId() + "/gama";
        var payload = { "f": "doserate", "v1": 100, "v2": 150, "r": 1};
        this.ajax(url, payload, function(data){
            console.log(data)
        });
        return false;
    }

});


$class("GamaDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "gama";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Temperature', 'name':'温度'},
            {'key':'Humidity', 'name':'湿度'},
            {'key':'BatteryHours', 'name':'电池时间'},
            {'key':'IfMainPowerOff', 'name':"电源"},
            {'key':'IfSmoke', 'name':'烟感'},
            {'key':'IfDoorOpen', 'name':'门禁'}]);

    },

    fillListDefault: function(page) {
        this.fillList(page)
    }
});