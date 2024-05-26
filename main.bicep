@description('Use the Resource Group Location')
param location string = 'centralus'

resource appService 'Microsoft.Web/sites@2020-06-01' = {
  name: 'helloworld-nodejs-4714'
  kind: 'app'
  location: location
  properties: {
    serverFarmId: '/subscriptions/991fd2c4-e56a-4cb1-9aeb-5fe4a5a9f8b7/resourceGroups/hello-world-nodejs-rg/providers/Microsoft.Web/serverFarms/helloworld-nodejs-plan'
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
    }
  }
}