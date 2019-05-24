/* eslint-disable camelcase */
/* eslint-disable max-len */
'use strict';
const sharp = require('sharp');
const fs = require('fs');

const CONTAINER_URL = '/api/ImageFiles/';
module.exports = function(PostImage) {
  PostImage.upload = function(ctx, options, access_token, post_id, user_id, cb) {
    if (!options) options = {};

    ctx.req.params.container = 'postImages';
    if (!fs.existsSync('./server/storage/' + ctx.req.params.container)) {
      fs.mkdirSync('./server/storage/' + ctx.req.params.container);
    }

    PostImage.find({where: {postId: post_id}}, (fer, files) => {
      if(!fer && files){
        files.map(fil => {
          fil.updateAttributes({postId: null});
        })
      }
    })

    PostImage.app.models.ImageFile.upload(ctx.req, ctx.result, options, (err, file) => {
      if (err) {
        cb(err);
      } else {
        var fileInfo = file.files.file[0];

        sharp('./server/storage/' + ctx.req.params.container + '/' + fileInfo.name)
                .resize(200, 200)
                .toFile('./server/storage/' + ctx.req.params.container + '/100-' + fileInfo.name, (err) => {
                  if (!err) {
                    PostImage.create({
                      url: CONTAINER_URL + fileInfo.container + '/download/' + fileInfo.name,
                      thumbnail: CONTAINER_URL + fileInfo.container + '/download/100-' + fileInfo.name,
                      created_at: new Date(),
                      postId: post_id,
                      userId: user_id,
                    }, (err2, image) => {
                      if (err2) {
                        cb(err2);
                      } else {
                        cb(null, image);
                      }
                    });
                  }
                });
      }
    });
  };

  PostImage.remoteMethod(
        'upload',
    {
      description: 'Uploads a file',
      accepts: [
                {arg: 'ctx', type: 'object', http: {source: 'context'}},
                {arg: 'options', type: 'object', http: {source: 'query'}},
                {arg: 'access_token', type: 'string'},
                {arg: 'post_id', type: 'string'},
                {arg: 'user_id', type: 'string'},
      ],
      returns: {
        arg: 'fileObject', type: 'object', root: true,
      },
      http: {verb: 'post'},
    }
    );
};
