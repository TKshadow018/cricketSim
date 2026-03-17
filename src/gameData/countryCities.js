const countryCities = [
  {
    name: 'Afghanistan',
    capital: 'Kabul',
    'other cities': [
      'Herat', 'Kandahar', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Balkh', 'Bamyan', 'Farah', 'Lashkargah',
      'Khost', 'Pul-e-Khumri', 'Sheberghan', 'Taloqan', 'Charikar', 'Faizabad', 'Baghlan', 'Andkhoy', 'Maimana', 'Nili'
    ]
  },
  {
    name: 'Australia',
    capital: 'Canberra',
    'other cities': [
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Geelong',
      'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Launceston', 'Mackay', 'Rockhampton'
    ]
  },
  {
    name: 'Bangladesh',
    capital: 'Dhaka',
    'other cities': [
      'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj', 'Gazipur',
      'Bogra', 'Jessore', 'Noakhali', 'Feni', 'Cox\'s Bazar', 'Dinajpur', 'Pabna', 'Kushtia', 'Tangail', 'Jamalpur'
    ]
  },
  {
    name: 'Canada',
    capital: 'Ottawa',
    'other cities': [
      'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London',
      'Halifax', 'Victoria', 'Saskatoon', 'Regina', 'St. John\'s', 'Kelowna', 'Windsor', 'Barrie', 'Sherbrooke', 'Trois-Rivieres'
    ]
  },
  {
    name: 'England',
    capital: 'London',
    'other cities': [
      'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle upon Tyne', 'Nottingham', 'Leicester', 'Coventry',
      'Southampton', 'Portsmouth', 'Brighton', 'Reading', 'Cambridge', 'Oxford', 'York', 'Norwich', 'Derby', 'Wolverhampton'
    ]
  },
  {
    name: 'India',
    capital: 'New Delhi',
    'other cities': [
      'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Chandigarh', 'Guwahati', 'Surat', 'Vadodara', 'Visakhapatnam', 'Coimbatore'
    ]
  },
  {
    name: 'Ireland',
    capital: 'Dublin',
    'other cities': [
      'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan', 'Ennis',
      'Kilkenny', 'Carlow', 'Athlone', 'Portlaoise', 'Wexford', 'Tralee', 'Naas', 'Letterkenny', 'Mullingar', 'Castlebar'
    ]
  },
  {
    name: 'Kenya',
    capital: 'Nairobi',
    'other cities': [
      'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Nyeri', 'Machakos',
      'Meru', 'Kericho', 'Naivasha', 'Isiolo', 'Lamu', 'Voi', 'Kakamega', 'Bungoma', 'Kilifi', 'Nanyuki'
    ]
  },
  {
    name: 'Namibia',
    capital: 'Windhoek',
    'other cities': [
      'Walvis Bay', 'Swakopmund', 'Rundu', 'Oshakati', 'Katima Mulilo', 'Rehoboth', 'Otjiwarongo', 'Keetmanshoop', 'Gobabis', 'Tsumeb',
      'Okahandja', 'Mariental', 'Outjo', 'Ondangwa', 'Luderitz', 'Karasburg', 'Karibib', 'Usakos', 'Aranos', 'Eenhana'
    ]
  },
  {
    name: 'Nepal',
    capital: 'Kathmandu',
    'other cities': [
      'Pokhara', 'Lalitpur', 'Biratnagar', 'Birgunj', 'Bharatpur', 'Janakpur', 'Butwal', 'Dharan', 'Hetauda', 'Nepalgunj',
      'Dhangadhi', 'Itahari', 'Bhimdatta', 'Ghorahi', 'Tulsipur', 'Kirtipur', 'Banepa', 'Bhaktapur', 'Siddharthanagar', 'Rajbiraj'
    ]
  },
  {
    name: 'Netherlands',
    capital: 'Amsterdam',
    'other cities': [
      'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede',
      'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht', 'Zwolle'
    ]
  },
  {
    name: 'New Zealand',
    capital: 'Wellington',
    'other cities': [
      'Auckland', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Palmerston North', 'Napier', 'Porirua', 'New Plymouth', 'Rotorua',
      'Whangarei', 'Nelson', 'Invercargill', 'Whanganui', 'Gisborne', 'Blenheim', 'Timaru', 'Pukekohe', 'Taupo', 'Upper Hutt'
    ]
  },
  {
    name: 'Oman',
    capital: 'Muscat',
    'other cities': [
      'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Bahla', 'Barka', 'Rustaq', 'Ibri', 'Khasab', 'Ibra',
      'Saham', 'Seeb', 'Duqm', 'Shinas', 'Liwa', 'Adam', 'Bidbid', 'Yanqul', 'Jalan Bani Bu Hassan', 'Al Buraimi'
    ]
  },
  {
    name: 'Pakistan',
    capital: 'Islamabad',
    'other cities': [
      'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala',
      'Sargodha', 'Bahawalpur', 'Sukkur', 'Larkana', 'Abbottabad', 'Mardan', 'Gujrat', 'Rahim Yar Khan', 'Kasur', 'Mirpur Khas'
    ]
  },
  {
    name: 'Scotland',
    capital: 'Edinburgh',
    'other cities': [
      'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Stirling', 'Perth', 'Paisley', 'East Kilbride', 'Livingston', 'Hamilton',
      'Dunfermline', 'Kilmarnock', 'Ayr', 'Cumbernauld', 'Kirkcaldy', 'Falkirk', 'Motherwell', 'Coatbridge', 'Greenock', 'Dumfries'
    ]
  },
  {
    name: 'South Africa',
    capital: 'Pretoria',
    'other cities': [
      'Cape Town', 'Johannesburg', 'Durban', 'Gqeberha', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley', 'Rustenburg',
      'Pietermaritzburg', 'Welkom', 'Soweto', 'Vereeniging', 'George', 'Mthatha', 'Benoni', 'Centurion', 'Tembisa', 'Mahikeng'
    ]
  },
  {
    name: 'Sri Lanka',
    capital: 'Sri Jayawardenepura Kotte',
    'other cities': [
      'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Matara', 'Batticaloa', 'Trincomalee', 'Kurunegala',
      'Ratnapura', 'Badulla', 'Moratuwa', 'Kalutara', 'Nuwara Eliya', 'Puttalam', 'Vavuniya', 'Kilinochchi', 'Mannar', 'Chilaw'
    ]
  },
  {
    name: 'UAE',
    capital: 'Abu Dhabi',
    'other cities': [
      'Dubai', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba', 'Dibba Al-Fujairah',
      'Madinat Zayed', 'Mussafah', 'Ruwais', 'Jebel Ali', 'Al Dhaid', 'Al Madam', 'Hatta', 'Liwa Oasis', 'Ghayathi', 'Dhaid'
    ]
  },
  {
    name: 'West Indies',
    capital: 'St. John\'s',
    'other cities': [
      'Bridgetown', 'Port of Spain', 'Georgetown', 'Kingston', 'Castries', 'Basseterre', 'Roseau', 'St. George\'s', 'Belmopan', 'Nassau',
      'Scarborough', 'Spanish Town', 'Montego Bay', 'Arima', 'San Fernando', 'Linden', 'New Amsterdam', 'May Pen', 'Mandeville', 'Freeport'
    ]
  },
  {
    name: 'Zimbabwe',
    capital: 'Harare',
    'other cities': [
      'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Marondera', 'Bindura',
      'Hwange', 'Redcliff', 'Rusape', 'Karoi', 'Zvishavane', 'Victoria Falls', 'Norton', 'Chegutu', 'Beitbridge', 'Plumtree'
    ]
  }
];

export default countryCities;
