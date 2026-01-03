# js-feasibility

Javascript開発のフィジビリティスタディです

## 環境構築

### Debian系

root権限で

    apt install -y nodejs npm
    npm install -g n
    n latest
    apt purge -y nodejs npm
    apt autoremove -y

### macOS

    brew install node
    npm install -g n

### Windows

n はWindowsには対応してないのでnvm


    choco install nvm
    nvm install 12.22.1
    nvm use 12.22.1

## 使い方

### Gulp

プロジェクトディレクトリに移動して

    npm i
    npx gulp
  
