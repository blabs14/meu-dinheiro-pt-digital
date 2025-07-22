import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function withETagCache(maxAge: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const oldJson = res.json;
    res.json = function (body) {
      const etag = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
      res.set('ETag', etag);
      res.set('Cache-Control', `public, max-age=${maxAge}`);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      return oldJson.call(this, body);
    };
    next();
  };
} 