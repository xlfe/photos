import Em from 'ember';


var naturalSort = function(a, b) {
    var cLoc, dre, hre, i, numS, oFxNcL, oFyNcL, ore, re, sre, x, xD, xN, y, yD, yN;
    re = /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/g;
    sre = /(^[ ]*|[ ]*$)/g;
    dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/;
    hre = /^0x[0-9a-f]+$/i;
    ore = /^0/;
    i = function(s) {
      return naturalSort.insensitive && ('' + s).toLowerCase() || '' + s;
    };
    x = i(a).replace(sre, '') || '';
    y = i(b).replace(sre, '') || '';
    xN = x.replace(re, '\u0000$1\u0000').replace(/\0$/, '').replace(/^\0/, '').split('\u0000');
    yN = y.replace(re, '\u0000$1\u0000').replace(/\0$/, '').replace(/^\0/, '').split('\u0000');
    xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && x.match(dre) && Date.parse(x));
    yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null;
    oFxNcL = void 0;
    oFyNcL = void 0;
    if (yD) {
      if (xD < yD) {
        return -1;
      }
      if (xD > yD) {
        return 1;
      }
    }
    cLoc = 0;
    numS = Math.max(xN.length, yN.length);
    while (cLoc < numS) {
      oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
      oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
      if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
        return (isNaN(oFxNcL) ? 1 : -1);
      } else if (typeof oFxNcL !== typeof oFyNcL) {
        oFxNcL += '';
        oFyNcL += '';
      }
      if (oFxNcL < oFyNcL) {
        return -1;
      }
      if (oFxNcL > oFyNcL) {
        return 1;
      }
      cLoc++;
    }
    return 0;
  };

naturalSort.insensitive = true;

export default Em.Controller.extend({
    needs:['album'],
    manualsortOptions: [
        {name: 'Title', val: 'title'},
        {name: 'Filename', val: 'filename'},
        {name: 'Uploaded date-time', val: 'uploaded'}
    ],

    sortOptions: function() {

        var photos = this.get('controllers.album.arrangedContent'),
            options = {},
            sortOptions = [];

        photos.forEach(function(_){
            for (var k in _.get('metadata')){
                options[k] = true;
            }
        });

        for (var k in options) {
            sortOptions.pushObject({
                name: k,
                val: 'metadata.'+k
            })
        }

        return this.manualsortOptions.concat(sortOptions);

    }.property('controllers.album.arrangedContent.length'),
    actions: {
        save: function () {

            if (Em.isNone(this.get('sort_by'))){
                alert('Please select the photo property to sort by')
                return;
            }

            var c = this.get('controllers.album'),
                photos = c.get('arrangedContent'),
                sort_by = this.get('sort_by'),
                ascending = this.get('sortDescending') === false,
                natural = this.get('sortNatural') === true,
                min = new Big(0.1),
                max = new Big(0.9),
                sorter = Em.ArrayController.create(),
                interval = max.minus(min).div(photos.length);

            Em.run(function(){

                sorter.set('sortProperties',[sort_by]);
                sorter.set('sortAscending',ascending);
                if (natural){
                    sorter.set('sortFunction',naturalSort);
                }

                sorter.set('content',photos);

                sorter.get('arrangedContent').forEach(function (_) {
                    _.set('pos', min.toString());
                    min = min.add(interval);
                });
            });
            this.send('closeModal')
        },
        sort_check: function(option){
            this.set('sort_by',option.val);
        },
        close: function () {
            this.send('closeModal');
        }
    }
});

