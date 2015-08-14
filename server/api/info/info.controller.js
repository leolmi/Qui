/* Created by Leo on 14/08/2015. */
'use strict';

exports.info = function(req, res) {
  var infos = {
    product: {
      name:'Ndo6',
      version:process.env.APP_VERSION || '?'
    }
  };
  return res.json(200, infos);
};
