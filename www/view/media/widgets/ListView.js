/**
 * Created by Healer on 14-6-5.
 */

$class("ListView", [kx.Weblet, kx.ActionMixin],
{
    _headers: null,

    _templateString: "<table class='table table-striped table-bordered table-hover table-full-width dataTable'><thead></thead><tbody></tbody></table>",

    _data: null,

    __constructor: function() {

    },

    onCreated: function(domNode) {

    },

    refresh: function(api, payload) {
        this.ajax(api, payload, kx.bind(this, "dataReceived"));
    },

    setHeaders: function(headers) {

        this._headers = headers;
        var thead = this._domNode.find("thead");

        var cl = ["<tr>"];
        for (var i in headers)
        {
            // console.log(headers[i]);
            cl.push('<td>');
            cl.push(headers[i]['name']);
            cl.push('</td>');
        }
        var html = cl.join("");

        thead.append($(html));
    },

    getShownData: function() {
        return this._data;
    },

    dataReceived: function(data) {


        var tbody = this._domNode.find("tbody");
        tbody.empty();

        var results = eval("(" + data + ")")['results'];
        var items = results['items']
        this._data = items;
        console.log(results)

        var headers = [];
        for (var j in this._headers)
        {
            headers.push(this._headers[j]['key']);
        }


        for (var i in items)
        {

            var cl = ["<tr>"];
            var item = items[i];
            for (var j in headers)
            {
                var key = headers[j];
                cl.push('<td>');

                if (key == 'handle')
                {
                    cl.push("<a class='btn blue handle'>处理</a>&nbsp;<input class='comment' placeholder='处理意见'/>");
                }
                else if (this._headers[j]['type'] == 'url')
                {
                    cl.push("<a href=" + item[key] + ">链接</a>");
                }
                else
                {
                    cl.push(item[key]);
                }
                cl.push('</td>');

            }

            cl.push("</tr>");

            var html = cl.join("");

            tbody.append($(html));
        }
    }
});