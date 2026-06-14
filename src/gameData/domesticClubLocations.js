const domesticClubLocations = {
  India: [
    'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Ranchi', 'Surat', 'Kochi', 'Guwahati', 'Visakhapatnam',
  ],
  Australia: [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin', 'Gold Coast', 'Newcastle',
    'Wollongong', 'Geelong', 'Townsville', 'Cairns', 'Ballarat', 'Bendigo', 'Launceston', 'Albany', 'Rockhampton', 'Toowoomba',
  ],
  England: [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Sheffield', 'Bristol', 'Nottingham', 'Leicester', 'Coventry',
    'Newcastle', 'Southampton', 'Portsmouth', 'Derby', 'York', 'Norwich', 'Brighton', 'Reading', 'Cambridge', 'Oxford',
  ],
  'New Zealand': [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Napier', 'Palmerston North', 'Nelson', 'Rotorua',
    'New Plymouth', 'Whangarei', 'Invercargill', 'Gisborne', 'Timaru', 'Blenheim', 'Taupo', 'Whanganui', 'Greymouth', 'Oamaru',
  ],
  Pakistan: [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan', 'Faisalabad', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad',
    'Bahawalpur', 'Sargodha', 'Gujranwala', 'Sukkur', 'Larkana', 'Abbottabad', 'Mardan', 'Kasur', 'Rahim Yar Khan', 'Gwadar',
  ],
  'South Africa': [
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley',
    'Pietermaritzburg', 'Rustenburg', 'George', 'Mthatha', 'Welkom', 'Upington', 'Stellenbosch', 'Soweto', 'Centurion', 'Benoni',
  ],
  'West Indies': [
    'Bridgetown', 'Kingston', 'Port of Spain', 'Georgetown', 'St Johns', 'Roseau', 'Basseterre', 'Castries', 'St George', 'Scarborough',
    'Arnos Vale', 'Antigua', 'Guyana', 'Trinidad', 'Barbados', 'Jamaica', 'Dominica', 'Grenada', 'St Lucia', 'Nevis',
  ],
  'Sri Lanka': [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Dambulla', 'Kurunegala', 'Matara', 'Negombo', 'Batticaloa', 'Anuradhapura',
    'Ratnapura', 'Trincomalee', 'Badulla', 'Nuwara Eliya', 'Puttalam', 'Polonnaruwa', 'Kalutara', 'Mannar', 'Chilaw', 'Ampara',
  ],
  Bangladesh: [
    'Dhaka', 'Chattogram', 'Narayanganj', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh', 'Comilla',
    'Bogra', 'Noakhali', 'Coxs Bazar', 'Jessore', 'Dinajpur', 'Gazipur', 'Pabna', 'Kushtia', 'Faridpur', 'Narsingdi',
  ],
  Afghanistan: [
    'Kabul', 'Kandahar', 'Herat', 'Mazar e Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Bamyan', 'Khost', 'Lashkar Gah',
    'Farah', 'Taloqan', 'Charikar', 'Sheberghan', 'Baghlan', 'Faryab', 'Paktia', 'Uruzgan', 'Nimruz', 'Badakhshan',
  ],
  Ireland: [
    'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Sligo', 'Kilkenny', 'Wexford', 'Athlone',
    'Dundalk', 'Ennis', 'Tralee', 'Carlow', 'Naas', 'Bray', 'Mullingar', 'Navan', 'Letterkenny', 'Clonmel',
  ],
  Zimbabwe: [
    'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Kwekwe', 'Kadoma', 'Chinhoyi', 'Marondera', 'Bindura',
    'Hwange', 'Kariba', 'Beitbridge', 'Lupane', 'Chegutu', 'Rusape', 'Zvishavane', 'Victoria Falls', 'Shurugwi', 'Gokwe',
  ],
  Netherlands: [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen',
    'Enschede', 'Haarlem', 'Arnhem', 'Zwolle', 'Leiden', 'Dordrecht', 'Maastricht', 'Apeldoorn', 'Leeuwarden', 'Den Bosch',
  ],
  Scotland: [
    'Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Inverness', 'Stirling', 'Perth', 'Paisley', 'Falkirk', 'Ayr',
    'Kilmarnock', 'Dunfermline', 'Hamilton', 'Motherwell', 'Kirkcaldy', 'Cumbernauld', 'Livingston', 'Elgin', 'Oban', 'Dumfries',
  ],
  Nepal: [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Bharatpur', 'Hetauda', 'Janakpur',
    'Nepalgunj', 'Dhangadhi', 'Itahari', 'Tansen', 'Ghorahi', 'Banepa', 'Bhaktapur', 'Kirtipur', 'Baglung', 'Jumla',
  ],
  UAE: [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Jebel Ali',
    'Madinat Zayed', 'Dibba', 'Kalba', 'Ruwais', 'Mussafah', 'Al Dhaid', 'Ghayathi', 'Al Madam', 'Masafi', 'Hatta',
  ],
  Oman: [
    'Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Barka', 'Ibri', 'Rustaq', 'Khasab', 'Ibra',
    'Bahla', 'Seeb', 'Saham', 'Duqm', 'Shinas', 'Bidbid', 'Nakhal', 'Liwa', 'Manah', 'Adam',
  ],
  Namibia: [
    'Windhoek', 'Walvis Bay', 'Swakopmund', 'Oshakati', 'Rundu', 'Ondangwa', 'Katima Mulilo', 'Keetmanshoop', 'Otjiwarongo', 'Gobabis',
    'Mariental', 'Luderitz', 'Okahandja', 'Tsumeb', 'Rehoboth', 'Karibib', 'Outjo', 'Opuwo', 'Usakos', 'Arandis',
  ],
  Canada: [
    'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax',
    'Victoria', 'Saskatoon', 'Regina', 'London', 'Windsor', 'Kitchener', 'Kelowna', 'Guelph', 'Barrie', 'Moncton',
  ],
  Kenya: [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Nyeri', 'Meru', 'Naivasha',
    'Kitale', 'Malindi', 'Garissa', 'Kakamega', 'Kericho', 'Embu', 'Voi', 'Lamu', 'Bungoma', 'Isiolo',
  ],
};

const fallbackLocations = [
  'Capital District', 'Harbor City', 'Highland', 'Riverside', 'Central', 'East Gate', 'West End', 'North Point',
  'South Park', 'Lakeside', 'Hillview', 'Old Town', 'Greenfield', 'Silver Coast', 'Maple Grove', 'Kingsport',
  'Sunset', 'Twin River', 'Rose Valley', 'Grand Plains',
];

export const getDomesticLocationsForCountry = (country) => {
  const locations = domesticClubLocations[country];
  if (Array.isArray(locations) && locations.length >= 12) {
    return [...locations];
  }
  return [...fallbackLocations];
};

export { domesticClubLocations };
