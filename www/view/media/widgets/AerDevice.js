/**
* Created by Healer on 14-9-9.
*/

$class("AerSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "aer";
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
        var url = "alert/set/" + g.getCurrentStationId() + "/hpic";
        var payload = { "f": "doserate", "v1": 100, "v2": 150, "r": 1};
        this.ajax(url, payload, function(data){
            console.log(data)
        });
        return false;
    }

});


$class("AerDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "aer";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'sid', 'name':'采样ID'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'path', 'name':'下载', 'type': 'url'}]);
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    onShow: function(params) {
        //this.__super(DeviceBase.prototype.onShow, params);

        this._currentShownDevice = this._deviceType;
        console.log("On Show: " + this._currentShownDevice);

        if (!params) {
            var payload = {
                start: g.getBeginTime('yyyy-MM-dd'),
                end: g.getEndTime('yyyy-MM-dd'),
                sid: null
            };
        } else {
            var payload = {
                start: g.getBeginTime('yyyy-MM-dd'),
                end: g.getEndTime('yyyy-MM-dd'),
                sid: params
            };
        }
        this.fetchDataBySid(payload);

        return false;
    },

    fetchDataBySid: function(payload) {
        var this_ = this;
        var currentStationId = g.getCurrentStationId();

        if (currentStationId)
        {
            var api = "data/fetchHpge/" + currentStationId;

            this.ajax(api, payload, function(data){
                var $r = eval("(" + data + ")");

                console.log($r);

                var items = $r.results.items;
                this_._items = items;
                this_.makeDataDict(items);

                this_.renderData();

            });
        }
    }
});
