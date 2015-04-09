/**
 * Created by Healer on 14-9-9.
 *
 *
*/

$class("WaterSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {
        this._stationId = 101;
    },

    onAttach: function(domNode) {
        this._deviceType = "bai9125";
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


$class("WaterDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "bai9125";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        /*
         `gammalong` varchar(32) DEFAULT NULL,
         `gammacps` varchar(32) DEFAULT NULL,
         `emissionlong` varchar(32) DEFAULT NULL,
         `emissioncps` varchar(32) DEFAULT NULL,
         `betacps` varchar(32) DEFAULT NULL,
        */
        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'gammalong', 'name':'γ比活度(Bq/m^3)'},
            {'key':'gammacps', 'name':'γ计数率(CPS)'},
            {'key':'emissionlong', 'name':'γ发射率(Bq/m^3/h)'},
            {'key':'emissioncps', 'name':'γ发射率(cps)'},
            {'key':'betacps', 'name':'β计数率(CPS)'}]);
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    showChartsTab: function() {

        this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var fieldItem = this._domNode.find('select.chart-field');
        console.log(fieldItem);
        var title = fieldItem.find(':selected').text();
        var field = fieldItem.val();
        var min = fieldItem.attr('min');
        var max = fieldItem.attr('max');

        var interval =  this._chartInterval || 30 * 10000;
        this.showCharts(this._domNode,
            {
                selector: "div.charts",
                title: title,
                ytitle: title,
                start: start,
                end: end,
                max:150,
                min:40,
                interval: interval,
                filter: kx.bind(this, 'filter')
            }
        );
    },

    filter: function(data) {
        var currentField = this._domNode.find('select.chart-field').val();
        return this.chartFilterData(data, currentField, this._chartInterval);
    },

    onTabChanged: function() {

    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    }


});
