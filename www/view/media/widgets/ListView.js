/**
 * Created by Healer on 14-6-5.
 */

$class("ListView", [kx.Weblet, kx.ActionMixin],
{
    _headers: null,

    _templateString: "<table class='table table-striped table-bordered table-hover table-full-width dataTable'><thead></thead><tbody></tbody></table>",

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

    dataReceived: function(data) {
        console.log(data)

        var tbody = this._domNode.find("tbody");

        var results = eval("(" + data + ")")['results'];
        var items = results['items']

        var headers = [];
        for (var j in this._headers)
        {
            headers.push(this._headers[j]['key']);
        }


        for (var i in items)
        {

            var cl = ["<tr>"];
            var item = items[i];
            for (var j in item)
            {
                if (headers.indexOf(j) >= 0)
                {
                    cl.push('<td>');
                    cl.push(item[j]);
                    cl.push('</td>');
                }
            }

            cl.push("</tr>");

            var html = cl.join("");

            tbody.append($(html));
        }
    }
});