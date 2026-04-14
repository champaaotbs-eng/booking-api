FROM node:22-alpine                                                                                                                                                                                                                          

# Create app directory                                                                                                                                                                                                                       
WORKDIR /booking-api                                                                                                                                                                                                                      

# A wildcard is used to ensure both package.json and package-lock.json are copied                                                                                                                                                            
COPY package*.json ./                                                                                                                                                                                                                        

RUN touch .env

# Install app dependencies                                                                                                                                                                                                                   
RUN npm ci                                                                                                                                                                                                                                                                                                                                                                                                                  

#Bundle app source                                                                                                                                                                                                                           
COPY . .                                                                                                                                                                                                                                     

# Creates a "dist" folder with production build                                                                                                                                                                                              
RUN npm run build                                                                                                                                                                                                                            

# Start the server using the production build                                                                                                                                                                                                
CMD ["node","dist/main.js"]