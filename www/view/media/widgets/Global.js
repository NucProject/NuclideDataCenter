/**
 * Created by Healer on 14-6-10.
 */

$class("GroupValue", null, {

    _values: null,

    __constructor: function(time) {
        this._time = time;
    },

    addValue: function(value) {
        if (this._values == null) {
            this._values = [];
        }
        this._values.push(value);
    },

    getValue: function() {
        var r = {}
        for (var i in this._values) {
            var v = this._values[i];
            for (var k in v) {
                if (k == 'time') {
                    continue;
                }
                if (r[k]) {
                    r[k] += parseFloat(v[k])
                } else {
                    r[k] = parseFloat(v[k])
                }

            }
        }
        var size = this._values.length;
        for (var k in r) {
            if (k != 'time')
                r[k] = (r[k] / size).toFixed(1);
        }
        for (var i in this._time) {
            r[i] = this._time[i];
        }
        return r;
    }
});


$class("Global", Base,
{
    _row: null,

    _curStationId: null,


    init: function() {

        var self = this;
        $("ul.sub-menu a").click(function(){

            var url = $(this).attr("href");
            var id = url;

            self.showRow(id);

            return false;
        });
    },

    addRow: function(row) {
        if (!this._row) {
            this._row = [];
        }

        this._row.push(row);
    },

    showRow: function(row) {
        for (var i in this._row)
        {
            if (this._row[i] == row)
            {
                $(row).show();
            }
            else
            {
                $(this._row[i]).hide();
            }
        }
    },

    getDeviceName: function(deviceType) {
        switch (deviceType)
        {
            case "hpic":
                return "高压电离室";
            case "labr":
                return "溴化镧能谱仪";
            case "cinderella":
                return "特征核素甄别系统";
            case "cinderelladata":
                return "特征核素甄别系统";
            case "hpge":
                return "高纯锗能谱仪";
            case "weather":
                return "气象站";
            case "environment":
                return "环境与安防监控";
        }
    },

    getCurrentStationId: function() {
        return this._curStationId;
    },

    setCurrentStationId: function(stationId) {
        this._curStationId = stationId;
    },

    getCurrentStationName: function() {
        return this._stationName;
    },

    setCurrentStationName: function(stationName) {
        this._stationName = stationName;
    },

    setBeginTime: function(beginTime) {
        this._beginTime = beginTime;
    },

    setEndTime: function(endTime) {
        this._endTime = endTime;
    },

    getBeginTime: function() {
        return this._beginTime || new Date();
    },
    getEndTime: function() {
        return this._endTime || new Date().addHours(24);
    },

    showTip: function(text, title) {

        $.gritter.add({
            'title': title || "系统消息",
            'text': text
        });
    },

    getUnixTime: function() {
        return Math.round(new Date().getTime()/1000);
    },

    setAlerts: function(alerts) {
        this._alerts = alerts;
    }

});
