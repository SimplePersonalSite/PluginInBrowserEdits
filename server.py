import http.server
import json
import os

class FilesystemServer(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        length = self.headers['content-length']
        data = self.rfile.read(int(length)).decode()
        data = json.loads(data)
        print(data)
        filename = data['filename']
        if any(s in filename for s in ('..', '/.', '//')) or any(s == filename for s in ('', '/')):
            self.send_response(403, 'invalid filename ' + filename)
        else:
            if filename[0] == '/':
                filename = filename[1:]
            assert filename[0] != '/'
            if not os.path.isfile(filename):
                self.send_response(404, 'file not found ' + filename)
            else:
                with open(filename, 'w') as fh:
                    fh.write(data['content'])
                self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

def parse_args(args=None):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', default=4113, type=int)
    parser.add_argument('--address', default='', type=str)
    return vars(parser.parse_args(args))

if __name__ == '__main__':
    args = parse_args()
    address = (args['address'], args['port'])
    server = http.server.HTTPServer(address, FilesystemServer)
    server.serve_forever()
