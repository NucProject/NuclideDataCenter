/**
* Created by Healer on 14-9-9.
*
*
*/

$class("MdsSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "mds";
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
        var url = "alert/set/" + g.getCurrentStationId() + "/mds";
        var payload = { "f": "doserate", "v1": 100, "v2": 150, "r": 1};
        this.ajax(url, payload, function(data){
            console.log(data)
        });
        return false;
    }

});


$class("MdsDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "mds";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'sid', 'name':'巡测ID'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'lat', 'name':'经度', 'type': 'str'},
            {'key':'lon', 'name':'纬度', 'type': 'str'},
            {'key':'speed', 'name':'速度'},
            {'key':'height', 'name':'高度'},
            //{'key':'map', 'name':'map'},    //????
            {'key':'doserateex', 'name':'扩展剂量率'},
            {'key':'ifatificial', 'name':'是否发现人工核素'}]);

        this.createSummaryList(domNode);
    },

    createSummaryList: function(domNode) {
        var sumContainer = domNode.find('div.sum-container');
        this._sumListView = new ListView();
        var dataListViewDomNode = this._sumListView.create();
        dataListViewDomNode.appendTo(sumContainer);

        var this_ = this;

        sumContainer.delegate('a', 'click', function(){

            this_.onSidClicked($(this));
            return false;
        });

        this._sumListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'sid', 'name': '巡测ID', 'type': 'link'},
            {'key':'begintime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'doserateex', 'name':'扩展剂量率'}]);
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    showChartsTab: function() {
        console.log(111)
        this._chartInterval = 30 * 10000;
        this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var fieldItem = this._domNode.find('select.chart-field');
        console.log(fieldItem);
        var title = fieldItem.find('option:selected').text();
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

    onIntervalChanged: function(sender) {
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