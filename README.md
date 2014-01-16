# abricos

Abricos Platform - Content Management System (CMS) and Internet Application Platform (WebOS)

### Setup

1. Install [NodeJS](http://nodejs.org/download/), if you don't have it yet.


2. Install global dependencies:

    ```
[sudo] npm install -g grunt-cli bower
    ```

3. Install local dependencies:

    ```
npm install
    ```

4. Initialize dependencies:

    ```
grunt
    ```

### Release

* Generate a zip file:

    ```
grunt zip
    ```

* Build modules and generate a release zip file:

    ```
grunt release
    ```

## License
Copyright (c) 2014 Alexander Kuzmin
Licensed under the GPLv2 license.
