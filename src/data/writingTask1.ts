export type Task1ChartType = 'table' | 'bar' | 'line' | 'pie' | 'map' | 'process';

/* ── Structured chart data types ── */
export type TableChartData = {
  type: 'table';
  headers: string[];
  rows: { label: string; cells: (string | number)[] }[];
  note?: string;
};

export type BarChartData = {
  type: 'bar';
  unit: string;
  groups: string[];
  series: { name: string; color: string; values: number[] }[];
};

export type LineChartData = {
  type: 'line';
  unit: string;
  xValues: string[];
  series: { name: string; color: string; values: number[] }[];
};

export type PieChartData = {
  type: 'pie';
  charts: { title: string; segments: { name: string; value: number; color: string }[] }[];
};

export type MapElement = {
  label: string;
  color: string;
  textColor?: string;
  x: number; y: number; w: number; h: number;
  fontSize?: number;
};
export type MapDiagramData = {
  type: 'map';
  viewBox?: string;
  periods: { label: string; elements: MapElement[] }[];
};

export type ProcessStage = { title: string; description: string; color: string; icon: string };
export type ProcessDiagramData = {
  type: 'process';
  stages: ProcessStage[];
};

export type ChartData = TableChartData | BarChartData | LineChartData | PieChartData | MapDiagramData | ProcessDiagramData;

export interface Task1Prompt {
  title: string;
  instruction: string; // shown above the chart
  chartData: ChartData;
}

export interface Task1TypeData {
  type: Task1ChartType;
  label: string;
  description: string;
  color: string;
  prompts: Task1Prompt[];
}

export const TASK1_DATA: Task1TypeData[] = [
  /* ═══════════════════ TABLE CHART ═══════════════════ */
  {
    type: 'table',
    label: 'Table Chart',
    description: 'Compare data across multiple categories in rows and columns.',
    color: 'blue',
    prompts: [
      {
        title: 'Household Income Distribution by Country (2020)',
        instruction: 'The table below shows the percentage of households in different income groups in five countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Low Income (%)', 'Middle Income (%)', 'High Income (%)'],
          rows: [
            { label: 'UK',      cells: [18, 56, 26] },
            { label: 'USA',     cells: [22, 48, 30] },
            { label: 'Germany', cells: [15, 60, 25] },
            { label: 'Japan',   cells: [20, 58, 22] },
            { label: 'Brazil',  cells: [42, 40, 18] },
          ],
          note: 'Low = below national median; Middle = 75–200% of median; High = above 200%.',
        },
      },
      {
        title: 'Average Monthly Household Expenditure – Three Cities (2022)',
        instruction: 'The table below shows the average monthly household expenditure across five categories in three major cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Category', 'London (£)', "Tokyo (¥'000)", 'New York ($)'],
          rows: [
            { label: 'Housing',    cells: ['£1,850', '¥142', '$2,100'] },
            { label: 'Food',       cells: ['£620',   '¥58',  '$700']   },
            { label: 'Transport',  cells: ['£280',   '¥19',  '$350']   },
            { label: 'Healthcare', cells: ['£150',   '¥9',   '$430']   },
            { label: 'Leisure',    cells: ['£310',   '¥26',  '$390']   },
          ],
        },
      },
      {
        title: 'Development Indicators in Six Countries (2000 vs 2020)',
        instruction: 'The table below compares the literacy rate, life expectancy, and GDP per capita of six developing countries in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Literacy 2000 (%)', 'Literacy 2020 (%)', 'Life Exp. 2000', 'Life Exp. 2020', 'GDP 2000 ($)', 'GDP 2020 ($)'],
          rows: [
            { label: 'India',      cells: [61, 77, 63, 70,  450,  2100] },
            { label: 'Nigeria',    cells: [57, 72, 47, 55,  380,  2230] },
            { label: 'Bangladesh', cells: [54, 75, 61, 73,  370,  1900] },
            { label: 'Vietnam',    cells: [90, 95, 69, 76,  410,  2800] },
            { label: 'Ethiopia',   cells: [33, 52, 48, 67,  130,   860] },
            { label: 'Bolivia',    cells: [86, 93, 63, 71, 1020,  3500] },
          ],
        },
      },
      {
        title: 'International Tourist Arrivals – Five Destinations (2019 vs 2022)',
        instruction: 'The table below shows the number of international tourist arrivals (in millions) and tourism revenue in five major destinations in 2019 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', '2019 Arrivals (m)', '2022 Arrivals (m)', '2019 Revenue ($bn)', '2022 Revenue ($bn)'],
          rows: [
            { label: 'France',  cells: [89.4, 79.4, 63.8, 54.2] },
            { label: 'Spain',   cells: [83.5, 71.7, 79.7, 73.9] },
            { label: 'USA',     cells: [79.3, 50.9, 246.0, 160.0] },
            { label: 'China',   cells: [65.7,  2.1,  35.8,   1.1] },
            { label: 'Italy',   cells: [65.1, 49.8,  44.2,  38.8] },
          ],
        },
      },
      {
        title: 'PISA Test Scores by Country – Reading, Mathematics and Science (2022)',
        instruction: 'The table below shows the average PISA scores in reading, mathematics and science for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Reading', 'Mathematics', 'Science', 'Overall Rank'],
          rows: [
            { label: 'Singapore', cells: [574, 575, 561, 1]  },
            { label: 'Japan',     cells: [516, 536, 547, 2]  },
            { label: 'Canada',    cells: [507, 497, 507, 7]  },
            { label: 'UK',        cells: [494, 489, 508, 11] },
            { label: 'USA',       cells: [504, 465, 499, 13] },
            { label: 'Australia', cells: [498, 487, 507, 10] },
          ],
          note: 'OECD average: Reading 476, Mathematics 472, Science 485.',
        },
      },
      {
        title: 'CO₂ Emissions per Capita (tonnes) – Selected Countries (2000 vs 2022)',
        instruction: 'The table below shows the CO₂ emissions per capita in tonnes for six countries in 2000 and 2022, along with the percentage change. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', '2000 (t)', '2022 (t)', 'Change (%)'],
          rows: [
            { label: 'USA',       cells: [19.8, 14.2, '-28'] },
            { label: 'China',     cells: [2.7,   8.1, '+200'] },
            { label: 'Germany',   cells: [10.2,  7.8, '-24'] },
            { label: 'India',     cells: [0.9,   1.9, '+111'] },
            { label: 'Australia', cells: [17.1, 14.7, '-14'] },
            { label: 'Brazil',    cells: [1.8,   2.3, '+28'] },
          ],
        },
      },
      {
        title: 'Healthcare Infrastructure by Country (2022)',
        instruction: 'The table below shows key healthcare infrastructure indicators for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Health Spend (% GDP)', 'Hospital Beds/1,000', 'Doctors/1,000', 'Nurses/1,000'],
          rows: [
            { label: 'USA',     cells: [16.8, 2.9, 2.6, 15.4] },
            { label: 'Germany', cells: [12.8, 8.0, 4.3, 12.8] },
            { label: 'Japan',   cells: [11.0, 13.0, 2.5, 11.8] },
            { label: 'UK',      cells: [10.2, 2.5, 2.8, 8.2]  },
            { label: 'Brazil',  cells: [9.5,  2.2, 2.1, 7.5]  },
            { label: 'India',   cells: [3.5,  0.5, 0.9, 1.7]  },
          ],
        },
      },
      {
        title: 'Average Annual Wages by Sector – Four Countries (2023)',
        instruction: 'The table below shows the average annual wages (in thousands of local currency) across five employment sectors in four countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Sector', 'USA ($k)', 'UK (£k)', 'Germany (€k)', 'Australia (AUDk)'],
          rows: [
            { label: 'Technology',     cells: [115, 72, 68, 140] },
            { label: 'Finance',        cells: [98,  65, 62, 118] },
            { label: 'Education',      cells: [52,  34, 48,  78] },
            { label: 'Healthcare',     cells: [71,  40, 52,  95] },
            { label: 'Manufacturing',  cells: [55,  36, 46,  82] },
          ],
        },
      },
      {
        title: 'Mobile Phone Subscriptions per 100 People – Five Regions (2010–2022)',
        instruction: 'The table below shows the number of mobile phone subscriptions per 100 people in five world regions from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', '2010', '2015', '2020', '2022'],
          rows: [
            { label: 'N. America',        cells: [98,  115, 127, 133] },
            { label: 'W. Europe',         cells: [120, 128, 134, 140] },
            { label: 'Asia-Pacific',      cells: [55,  92,  112, 126] },
            { label: 'S. America',        cells: [90,  122, 117, 119] },
            { label: 'Sub-Saharan Africa',cells: [30,  68,  79,  84]  },
          ],
        },
      },
      {
        title: 'University Graduation Rates by Field and Gender (2022)',
        instruction: 'The table below shows the graduation rates (%) for male and female students across six academic fields in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Field of Study', 'Male (%)', 'Female (%)', 'Total (%)'],
          rows: [
            { label: 'Engineering',      cells: [81, 78, 80] },
            { label: 'Business',         cells: [74, 78, 76] },
            { label: 'Sciences',         cells: [71, 75, 73] },
            { label: 'Humanities',       cells: [68, 73, 71] },
            { label: 'Medicine',         cells: [92, 94, 93] },
            { label: 'Social Sciences',  cells: [72, 76, 74] },
          ],
        },
      },
      {
        title: 'Child Poverty and Government Social Spending by Country (2022)',
        instruction: 'The table below shows the child poverty rate, government social spending as a percentage of GDP, and annual child benefit payments in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Child Poverty (%)', 'Social Spend (% GDP)', 'Child Benefit ($/yr)'],
          rows: [
            { label: 'Finland', cells: [3.6,  28.7, 2800] },
            { label: 'USA',     cells: [17.8, 18.7, 0]    },
            { label: 'UK',      cells: [18.6, 21.5, 1200] },
            { label: 'Germany', cells: [10.3, 25.9, 2400] },
            { label: 'Brazil',  cells: [28.4, 16.3, 680]  },
            { label: 'Japan',   cells: [13.5, 23.1, 1800] },
          ],
        },
      },
      {
        title: 'Household Electricity Consumption by Country and Dwelling Type (2022)',
        instruction: 'The table below shows the average annual household electricity consumption (in kWh) for houses and flats in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'House (kWh/yr)', 'Flat (kWh/yr)', 'National Avg (kWh/yr)'],
          rows: [
            { label: 'USA',       cells: [12400, 7500, 10500] },
            { label: 'Canada',    cells: [11200, 6800, 9500]  },
            { label: 'UK',        cells: [4100,  2800, 3700]  },
            { label: 'France',    cells: [6200,  4300, 5500]  },
            { label: 'Japan',     cells: [4600,  2900, 4000]  },
            { label: 'Australia', cells: [8100,  5200, 7200]  },
          ],
        },
      },
      {
        title: 'Renewable Energy as a Percentage of Electricity Generation – Six Countries (2010–2022)',
        instruction: 'The table below shows the share of renewable energy in total electricity generation (%) for six countries between 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', '2010 (%)', '2015 (%)', '2020 (%)', '2022 (%)'],
          rows: [
            { label: 'Denmark',  cells: [36, 57, 78, 88] },
            { label: 'Germany',  cells: [17, 33, 46, 49] },
            { label: 'Spain',    cells: [33, 37, 47, 52] },
            { label: 'UK',       cells: [7,  24, 43, 43] },
            { label: 'USA',      cells: [10, 13, 19, 22] },
            { label: 'China',    cells: [19, 25, 28, 30] },
          ],
        },
      },
      {
        title: 'Foreign Language Proficiency (% of Adults) – Five European Countries',
        instruction: 'The table below shows the percentage of adults who speak selected foreign languages in five European countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'English (%)', 'German (%)', 'French (%)', 'Spanish (%)'],
          rows: [
            { label: 'Netherlands', cells: [90, 69, 22, 23] },
            { label: 'Sweden',      cells: [86, 30, 28, 19] },
            { label: 'Finland',     cells: [73, 18, 22,  7] },
            { label: 'France',      cells: [39, 17,  '-', 26] },
            { label: 'Italy',       cells: [34, 13, 25,  8] },
            { label: 'Poland',      cells: [41, 19,  8,  5] },
          ],
          note: '"-" indicates native-language country.',
        },
      },
      {
        title: 'Road Traffic Fatalities per 100,000 Population – Major Regions (2010–2021)',
        instruction: 'The table below shows the number of road traffic fatalities per 100,000 population in six world regions in 2010, 2015 and 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', '2010', '2015', '2021'],
          rows: [
            { label: 'N. America',         cells: [10.4, 9.0, 12.7] },
            { label: 'W. Europe',          cells: [5.6,  4.3, 3.9]  },
            { label: 'E. Europe',          cells: [14.8, 11.2, 9.1] },
            { label: 'SE Asia',            cells: [24.3, 22.1, 18.5] },
            { label: 'Sub-Saharan Africa', cells: [32.2, 28.4, 26.6] },
            { label: 'S. America',         cells: [19.5, 18.1, 17.3] },
          ],
        },
      },
      {
        title: 'Population and Area – Five Global Megacities (2022)',
        instruction: 'The table below shows the metropolitan population, annual population growth rate and total city area of five major world cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', 'Metro Pop (m)', '% of Country', 'Annual Growth (%)', 'Area (km²)'],
          rows: [
            { label: 'Tokyo',       cells: [37.4, 29.5, 0.3, 13960] },
            { label: 'New York',    cells: [18.8,  5.7, 0.9,  8683] },
            { label: 'Mumbai',      cells: [20.7,  1.5, 2.8,  4355] },
            { label: 'Lagos',       cells: [15.3,  7.3, 3.9,  1171] },
            { label: 'Mexico City', cells: [21.7, 17.1, 1.3,  7866] },
          ],
        },
      },
      {
        title: 'School Completion Rates (%) by World Region and Level (2022)',
        instruction: 'The table below shows the percentage of children completing primary, lower-secondary and upper-secondary education in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Primary (%)', 'Lower Secondary (%)', 'Upper Secondary (%)'],
          rows: [
            { label: 'E. Asia & Pacific',    cells: [97, 95, 87] },
            { label: 'Latin America',        cells: [95, 92, 75] },
            { label: 'S. Asia',              cells: [91, 81, 60] },
            { label: 'Middle East & N. Africa', cells: [93, 84, 66] },
            { label: 'Sub-Saharan Africa',   cells: [74, 62, 40] },
          ],
        },
      },
      {
        title: 'Plastic Waste Generation and Recycling Rates by Country (2022)',
        instruction: 'The table below shows the annual plastic waste generated per person, the recycling rate and the proportion sent to landfill in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Plastic Waste (kg/person)', 'Recycled (%)', 'Landfill (%)', 'Mismanaged (%)'],
          rows: [
            { label: 'USA',     cells: [130, 9,  76, 2]  },
            { label: 'Germany', cells: [81,  62, 34, 1]  },
            { label: 'Japan',   cells: [69,  86,  8, 1]  },
            { label: 'Brazil',  cells: [67,  22, 59, 19] },
            { label: 'China',   cells: [59,  26, 55, 19] },
            { label: 'Nigeria', cells: [26,   5, 35, 60] },
          ],
        },
      },
      {
        title: 'Primary Energy Source Mix by Country (2022)',
        instruction: 'The table below shows the percentage share of different primary energy sources in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Oil (%)', 'Coal (%)', 'Gas (%)', 'Nuclear (%)', 'Renewables (%)'],
          rows: [
            { label: 'Saudi Arabia', cells: [60,  1, 37, 0,  2]  },
            { label: 'Germany',      cells: [34, 17, 26, 6, 17]  },
            { label: 'France',       cells: [28,  3, 16, 40, 13] },
            { label: 'India',        cells: [29, 44,  7, 1, 19]  },
            { label: 'Brazil',       cells: [36,  6, 13, 1, 44]  },
            { label: 'Australia',    cells: [34, 30, 25, 0, 11]  },
          ],
        },
      },
      {
        title: 'Billionaires, Wealth and Income Inequality by Country (2023)',
        instruction: 'The table below shows the number of billionaires, their total wealth, and the Gini coefficient (income inequality measure) for six countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Billionaires', 'Billionaire Wealth ($bn)', 'Gini Coefficient', 'GDP per Capita ($)'],
          rows: [
            { label: 'USA',     cells: [735, 4460, 0.41, 76400] },
            { label: 'China',   cells: [495, 1430, 0.47, 12700] },
            { label: 'India',   cells: [169,  675, 0.35,  2400] },
            { label: 'Germany', cells: [126,  595, 0.31, 50800] },
            { label: 'UK',      cells: [56,   225, 0.36, 46200] },
            { label: 'Brazil',  cells: [65,   240, 0.52,  9800] },
          ],
          note: 'Gini: 0 = perfect equality; 1 = perfect inequality.',
        },
      },
      {
        title: 'Graduate Employment Outcomes by Subject – UK (2022)',
        instruction: 'The table below shows the employment outcomes and median starting salaries for graduates across six subject areas in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Subject', 'Employed (%)', 'Further Study (%)', 'Unemployed (%)', 'Median Salary (£)'],
          rows: [
            { label: 'Medicine',         cells: [95, 3,  2,  42000] },
            { label: 'Engineering',      cells: [87, 8,  5,  38000] },
            { label: 'Law',              cells: [82, 10, 8,  34000] },
            { label: 'Business',         cells: [79, 12, 9,  32000] },
            { label: 'Social Sciences',  cells: [74, 16, 10, 29000] },
            { label: 'Arts & Humanities',cells: [68, 18, 14, 26000] },
          ],
        },
      },
      {
        title: 'Alcohol Consumption and Related Health Costs – Six World Regions (2019)',
        instruction: 'The table below shows the average alcohol consumption per adult and related health costs across six world regions in 2019. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Litres/Adult/yr', 'Heavy Drinkers (%)', 'Liver Disease Rate/100k', 'Health Cost (% GDP)'],
          rows: [
            { label: 'E. Europe',  cells: [12.3, 22.1, 28.4, 1.8] },
            { label: 'W. Europe',  cells: [9.8,  14.2, 19.2, 1.4] },
            { label: 'Americas',   cells: [8.1,  15.8, 16.3, 1.2] },
            { label: 'W. Pacific', cells: [7.3,  12.4, 15.1, 0.9] },
            { label: 'Africa',     cells: [6.4,  11.2, 12.8, 0.7] },
            { label: 'SE Asia',    cells: [4.7,   8.3,  9.6, 0.6] },
          ],
        },
      },
      {
        title: 'House Price-to-Income Ratio – Major Cities (2023)',
        instruction: 'The table below shows the median house price, median household income and the resulting price-to-income ratio for five major cities in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', 'Median House Price', 'Median Income/yr', 'Price-to-Income Ratio'],
          rows: [
            { label: 'Sydney',   cells: ['AUD 1.2m', 'AUD 95k', 12.6] },
            { label: 'London',   cells: ['£520k',    '£38k',    13.7]  },
            { label: 'Toronto',  cells: ['CAD 1.1m', 'CAD 72k', 15.3] },
            { label: 'New York', cells: ['$780k',    '$68k',    11.5]  },
            { label: 'Berlin',   cells: ['€550k',    '€38k',    14.5]  },
          ],
          note: 'Higher ratio = less affordable.',
        },
      },
      {
        title: 'Crime Rates per 100,000 Population – Six Countries (2022)',
        instruction: 'The table below shows rates of homicide, robbery and assault per 100,000 population in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Homicide', 'Robbery', 'Assault', 'Total Violent Crime'],
          rows: [
            { label: 'USA',       cells: [5.8,  62, 280, 367] },
            { label: 'UK',        cells: [1.1,  86, 450, 556] },
            { label: 'Australia', cells: [1.0,  40, 370, 440] },
            { label: 'Brazil',    cells: [22.4, 120, 590, 752] },
            { label: 'Japan',     cells: [0.2,   2,  25,  28] },
            { label: 'Germany',   cells: [1.0,  46, 200, 278] },
          ],
        },
      },
      {
        title: 'Working-Age Population and Dependency Ratios – Six Countries (2020 vs Projected 2040)',
        instruction: 'The table below compares the working-age population and old-age dependency ratio for six countries in 2020 and projected figures for 2040. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Working-Age 2020 (m)', 'Projected 2040 (m)', 'Dependency Ratio 2020', 'Projected 2040'],
          rows: [
            { label: 'Germany', cells: [54,  46,  0.55, 0.74] },
            { label: 'Japan',   cells: [68,  55,  0.62, 0.84] },
            { label: 'Nigeria', cells: [96,  172, 0.88, 0.72] },
            { label: 'India',   cells: [881, 1050, 0.59, 0.50] },
            { label: 'Brazil',  cells: [145, 154, 0.56, 0.65] },
            { label: 'UK',      cells: [43,  42,  0.51, 0.63] },
          ],
        },
      },
      {
        title: 'Infant Mortality Rate (per 1,000 Live Births) – Six Regions (1990–2022)',
        instruction: 'The table below shows the infant mortality rate per 1,000 live births in six world regions from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', '1990', '2000', '2010', '2022'],
          rows: [
            { label: 'Sub-Saharan Africa',     cells: [107, 91, 73, 48] },
            { label: 'S. Asia',                cells: [90,  72, 52, 34] },
            { label: 'E. Asia & Pacific',      cells: [46,  32, 21, 12] },
            { label: 'Latin America',          cells: [43,  29, 19, 12] },
            { label: 'Middle East & N. Africa',cells: [58,  44, 29, 18] },
            { label: 'OECD High Income',       cells: [11,   7,  5,  4] },
          ],
        },
      },
      {
        title: 'Smartphone Ownership and Internet Access by Country (2022)',
        instruction: 'The table below shows the percentage of the population owning a smartphone, having internet access and using social media in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Smartphone (% pop.)', 'Internet Access (%)', 'Social Media Use (%)'],
          rows: [
            { label: 'UAE',      cells: [97, 99, 98] },
            { label: 'Sweden',   cells: [94, 97, 84] },
            { label: 'UK',       cells: [87, 96, 82] },
            { label: 'Brazil',   cells: [79, 84, 76] },
            { label: 'India',    cells: [54, 65, 45] },
            { label: 'Nigeria',  cells: [42, 48, 33] },
          ],
        },
      },
      {
        title: 'Agricultural Land Use and Crop Yield – Five Countries (2021)',
        instruction: 'The table below shows agricultural land use, the proportion of arable land, average cereal yield and irrigated agriculture as a percentage of agricultural land in five countries in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Agri Land (% territory)', 'Arable Land (%)', 'Cereal Yield (t/ha)', 'Irrigated Agri (%)'],
          rows: [
            { label: 'India',     cells: [60.5, 52.8, 3.1, 35] },
            { label: 'USA',       cells: [44.5, 16.7, 8.2, 11] },
            { label: 'Brazil',    cells: [33.1,  9.2, 5.8,  5] },
            { label: 'China',     cells: [54.7, 12.0, 6.4, 40] },
            { label: 'Australia', cells: [53.0,  6.7, 2.8,  3] },
          ],
        },
      },
      {
        title: 'Public Transport Ridership – Major Cities (2019 vs 2022)',
        instruction: 'The table below shows annual public transport trips (in billions) and the public transport modal share in five major cities in 2019 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', '2019 Trips (bn)', '2022 Trips (bn)', '% Recovery', 'Modal Share 2022 (%)'],
          rows: [
            { label: 'Tokyo',     cells: [9.8, 8.6, 88, 48] },
            { label: 'New York',  cells: [2.3, 1.8, 78, 55] },
            { label: 'London',    cells: [4.1, 3.5, 85, 61] },
            { label: 'Shanghai',  cells: [10.1, 7.4, 73, 52] },
            { label: 'Singapore', cells: [1.8, 1.5, 83, 66] },
          ],
        },
      },
      {
        title: 'Life Expectancy at Birth by Gender – Six Countries (2022)',
        instruction: 'The table below shows the male and female life expectancy at birth, the gender gap and the healthy life expectancy for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Male (years)', 'Female (years)', 'Gender Gap', 'Healthy Life Exp. (years)'],
          rows: [
            { label: 'Japan',       cells: [81.1, 87.1, 6.0, 74] },
            { label: 'Switzerland', cells: [81.9, 85.8, 3.9, 73] },
            { label: 'UK',          cells: [79.4, 83.1, 3.7, 70] },
            { label: 'USA',         cells: [75.1, 80.5, 5.4, 67] },
            { label: 'Brazil',      cells: [72.5, 79.7, 7.2, 63] },
            { label: 'Nigeria',     cells: [55.4, 56.9, 1.5, 49] },
          ],
        },
      },
      {
        title: 'Vaccination Coverage (%) by Vaccine and Income Group (2022)',
        instruction: 'The table below shows the vaccination coverage rates (%) for five major vaccines across four country income groups in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Vaccine', 'High Income (%)', 'Upper-Middle (%)', 'Lower-Middle (%)', 'Low Income (%)'],
          rows: [
            { label: 'DTP3',       cells: [96, 88, 83, 72] },
            { label: 'Measles',    cells: [94, 91, 85, 69] },
            { label: 'Polio',      cells: [95, 89, 86, 73] },
            { label: 'Hepatitis B',cells: [93, 87, 82, 68] },
            { label: 'BCG (TB)',   cells: [91, 94, 90, 84] },
          ],
        },
      },
      {
        title: 'Government Education Spending by Country (2021)',
        instruction: 'The table below shows government education spending as a percentage of GDP and as a percentage of total government budget, plus per-student spending at primary and higher education levels, in five countries in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Spend (% GDP)', 'Spend (% Govt Budget)', 'Primary Spend/Student ($)', 'Higher Ed Spend/Student ($)'],
          rows: [
            { label: 'Norway',  cells: [5.8, 12.5, 14800, 32000] },
            { label: 'USA',     cells: [5.0, 11.6, 13200, 31800] },
            { label: 'UK',      cells: [4.5, 10.1,  9800, 22600] },
            { label: 'Germany', cells: [4.1,  9.4,  9900, 17400] },
            { label: 'Brazil',  cells: [5.9, 17.4,  3200,  6100] },
            { label: 'India',   cells: [2.9, 14.1,   860,  2200] },
          ],
        },
      },
      {
        title: 'Unemployment Rate (%) by Age Group – Six Countries (2022)',
        instruction: 'The table below shows the unemployment rates for four age groups in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Youth 15–24 (%)', 'Adults 25–34 (%)', 'Core 35–54 (%)', 'Older 55–64 (%)'],
          rows: [
            { label: 'Spain',   cells: [30.1, 15.4, 10.2, 9.8] },
            { label: 'Italy',   cells: [24.9, 13.6,  7.8, 6.4] },
            { label: 'France',  cells: [18.8, 10.5,  6.9, 6.1] },
            { label: 'Germany', cells: [5.6,   3.8,  2.9, 3.1] },
            { label: 'UK',      cells: [11.4,  5.9,  3.8, 3.2] },
            { label: 'USA',     cells: [8.8,   5.4,  3.5, 3.1] },
          ],
        },
      },
      {
        title: 'Fruit and Vegetable Consumption (g/day per Person) – Six Countries (2022)',
        instruction: 'The table below shows the average daily consumption of fruit and vegetables per person in six countries in 2022, compared with the WHO recommended target. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Fruit (g/day)', 'Vegetables (g/day)', 'Total (g/day)', 'Meets WHO Target (400g+)'],
          rows: [
            { label: 'Greece',  cells: [348, 440, 788, 'Yes'] },
            { label: 'Japan',   cells: [181, 278, 459, 'Yes'] },
            { label: 'Brazil',  cells: [195, 288, 483, 'Yes'] },
            { label: 'USA',     cells: [126, 192, 318, 'No']  },
            { label: 'UK',      cells: [109, 175, 284, 'No']  },
            { label: 'Germany', cells: [143, 222, 365, 'No']  },
          ],
        },
      },
      {
        title: 'Global Film Industry – Box Office and Admissions by Region (2022)',
        instruction: 'The table below shows the box-office revenue, number of cinema admissions and average ticket price in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Box Office ($bn)', 'Admissions (bn)', 'Avg Ticket Price ($)', 'Screens (thousands)'],
          rows: [
            { label: 'N. America',       cells: [9.4, 0.9, 10.4, 42] },
            { label: 'E. Asia',          cells: [7.8, 1.6,  4.9, 95] },
            { label: 'Europe',           cells: [4.2, 0.8,  5.2, 33] },
            { label: 'S. & SE Asia',     cells: [2.8, 1.2,  2.3, 29] },
            { label: 'Latin America',    cells: [1.1, 0.4,  2.8, 15] },
            { label: 'Middle East & Africa', cells: [0.6, 0.2, 3.0, 8] },
          ],
        },
      },
      {
        title: 'Water Stress and Access to Clean Water – Six Regions (2022)',
        instruction: 'The table below shows the water stress index, the percentage of the population with access to clean drinking water and improved sanitation, and annual water withdrawals for six world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Water Stress (0–5)', 'Clean Water (%)', 'Sanitation (%)', 'Withdrawals (km³/yr)'],
          rows: [
            { label: 'Middle East',        cells: [4.8, 94, 91, 272] },
            { label: 'S. Asia',            cells: [3.9, 88, 72, 904] },
            { label: 'N. Africa',          cells: [3.6, 90, 85, 201] },
            { label: 'Sub-Saharan Africa', cells: [2.4, 64, 42, 148] },
            { label: 'S. America',         cells: [1.8, 97, 88, 265] },
            { label: 'Europe',             cells: [1.2, 99, 98, 329] },
          ],
        },
      },
      {
        title: 'Patent Applications by Technology Field and Country (2022)',
        instruction: 'The table below shows the number of patent applications filed in five technology fields by five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Technology Field', 'USA', 'China', 'Japan', 'Germany', 'S. Korea'],
          rows: [
            { label: 'Digital Communication', cells: [18420, 38200, 12100, 4800,  9200] },
            { label: 'Medical Technology',    cells: [14600, 11400,  7800, 6200,  3400] },
            { label: 'Computer Technology',   cells: [21800, 44600,  9200, 3900,  8100] },
            { label: 'Electrical Machinery',  cells: [12300, 28700, 10400, 5600,  7300] },
            { label: 'Biotechnology',         cells: [9400,  10200,  4100, 5800,  2800] },
          ],
        },
      },
      {
        title: 'Net Migration and Remittances – Top Destination Countries (2022)',
        instruction: 'The table below shows the net annual migration, total immigrant stock, immigrants as a percentage of population and total remittances sent in six major destination countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Net Migration/yr (000s)', 'Immigrant Stock (m)', 'Immigrants (% pop.)', 'Remittances Sent ($bn)'],
          rows: [
            { label: 'USA',       cells: [900, 50.6, 15.3, 74.8] },
            { label: 'Germany',   cells: [550, 15.8, 18.8, 22.1] },
            { label: 'UK',        cells: [745,  9.4, 14.0, 24.7] },
            { label: 'Canada',    cells: [410,  8.0, 21.3, 10.4] },
            { label: 'Australia', cells: [280,  7.7, 30.1,  7.9] },
            { label: 'UAE',       cells: [320,  8.7, 88.1, 43.2] },
          ],
        },
      },
      {
        title: 'Prison Population and Recidivism – Six Countries (2022)',
        instruction: 'The table below shows the prison population rate per 100,000 people, total prisoner numbers, prison occupancy rate and the recidivism rate (re-offending within 2 years) for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Prison Rate/100k', 'Total Prisoners (000s)', 'Occupancy (%)', 'Recidivism (%)'],
          rows: [
            { label: 'USA',     cells: [639, 2100, 103, 67] },
            { label: 'Brazil',  cells: [381,  822, 168, 70] },
            { label: 'Russia',  cells: [308,  450,  96, 60] },
            { label: 'UK',      cells: [134,   88, 104, 46] },
            { label: 'Germany', cells: [74,    62,  81, 34] },
            { label: 'Japan',   cells: [38,    48,  58, 28] },
          ],
        },
      },
      {
        title: 'Maternal Mortality Ratio – Six World Regions (2000–2020)',
        instruction: 'The table below shows the maternal mortality ratio (deaths per 100,000 live births) for six world regions in 2000, 2010 and 2020, together with the percentage reduction over the period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', '2000', '2010', '2020', '% Reduction'],
          rows: [
            { label: 'W. Africa',     cells: [1290, 950, 608, 53] },
            { label: 'E. Africa',     cells: [864,  620, 388, 55] },
            { label: 'S. Asia',       cells: [412,  238, 145, 65] },
            { label: 'SE Asia',       cells: [218,  136,  79, 64] },
            { label: 'Latin America', cells: [94,    74,  65, 31] },
            { label: 'High Income',   cells: [11,    10,  10,  9] },
          ],
        },
      },
      {
        title: 'Sports Participation Rate (%) by Age and Gender – UK (2022)',
        instruction: 'The table below shows the percentage of people participating in selected sports at least once per week, broken down by gender and two age groups, in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Sport', 'Men 16–34 (%)', 'Women 16–34 (%)', 'Men 35–54 (%)', 'Women 35–54 (%)'],
          rows: [
            { label: 'Football',    cells: [48, 16, 22,  7] },
            { label: 'Running',     cells: [34, 32, 28, 25] },
            { label: 'Swimming',    cells: [22, 30, 18, 28] },
            { label: 'Cycling',     cells: [27, 16, 24, 14] },
            { label: 'Gym/Fitness', cells: [51, 48, 30, 28] },
            { label: 'Tennis',      cells: [12, 10, 10,  9] },
          ],
        },
      },
      {
        title: 'Official Development Assistance – Top Donor Countries (2022)',
        instruction: 'The table below shows the total official development assistance (ODA), ODA as a percentage of gross national income (GNI) and the bilateral aid share for six donor countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'ODA ($bn)', 'ODA (% of GNI)', 'Bilateral Aid (%)', 'Top Recipient Region'],
          rows: [
            { label: 'USA',     cells: [55.3, 0.22, 45, 'Africa & ME'] },
            { label: 'Germany', cells: [35.1, 0.83, 62, 'Africa & Asia'] },
            { label: 'Japan',   cells: [17.6, 0.39, 57, 'Asia'] },
            { label: 'UK',      cells: [15.9, 0.51, 54, 'Africa & Asia'] },
            { label: 'France',  cells: [15.4, 0.56, 60, 'Africa'] },
            { label: 'Sweden',  cells: [5.9,  0.93, 48, 'Africa'] },
          ],
          note: 'UN target: 0.7% of GNI.',
        },
      },
      {
        title: 'Natural Disaster Frequency and Economic Losses (Annual Average 2012–2022)',
        instruction: 'The table below shows the average annual frequency, deaths and economic losses from six types of natural disaster globally between 2012 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Disaster Type', 'Events/yr (avg)', 'Deaths/yr (avg)', 'Economic Loss ($bn/yr)', '% of Total Loss'],
          rows: [
            { label: 'Floods',       cells: [192, 4800, 42, 31] },
            { label: 'Storms',       cells: [185, 2100, 68, 51] },
            { label: 'Earthquakes',  cells: [54, 12000, 15, 11] },
            { label: 'Drought',      cells: [28,   600,  5,  4] },
            { label: 'Extreme Heat', cells: [38,  3200,  3,  2] },
            { label: 'Wildfires',    cells: [22,   180,  2,  1] },
          ],
        },
      },
      {
        title: 'Youth Unemployment Rate (%) by Gender and Region (2022)',
        instruction: 'The table below shows the youth (aged 15–24) unemployment rate for males and females, the overall youth unemployment rate and the NEET rate (not in education, employment or training) in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Male (%)', 'Female (%)', 'Overall (%)', 'NEET Rate (%)'],
          rows: [
            { label: 'N. Africa',        cells: [24.5, 38.6, 30.2, 25.4] },
            { label: 'Sub-Saharan Africa',cells: [9.8, 11.4, 10.5, 22.6] },
            { label: 'S. Asia',          cells: [12.6, 23.4, 16.5, 29.8] },
            { label: 'Latin America',    cells: [16.8, 20.4, 18.4, 21.6] },
            { label: 'High-Income OECD', cells: [10.4,  9.8, 10.1, 12.3] },
          ],
        },
      },
      {
        title: 'CO₂ Emissions by Transport Mode (gCO₂e per Passenger-km) (2022)',
        instruction: 'The table below shows the carbon dioxide equivalent emissions per passenger-kilometre for various modes of transport and their global modal share in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Transport Mode', 'gCO₂e/pkm', 'Global Modal Share (%)', 'Typical Journey Type'],
          rows: [
            { label: 'Short-haul Flight',  cells: [254,  11, 'Under 3 hrs']   },
            { label: 'Long-haul Flight',   cells: [195,   8, 'Over 3 hrs']    },
            { label: 'Private Car',        cells: [171,  44, 'Urban & inter-city'] },
            { label: 'Ferry',              cells: [120,   5, 'Coastal/island'] },
            { label: 'Coach/Bus',          cells: [27,   17, 'Urban & inter-city'] },
            { label: 'Electric Car',       cells: [18,    2, 'Urban & inter-city'] },
            { label: 'Passenger Train',    cells: [16,    8, 'Inter-city']    },
          ],
        },
      },
      {
        title: 'Energy Consumption per Capita (GJ/person) – Six Countries (2010–2022)',
        instruction: 'The table below shows the energy consumption per capita in gigajoules per person for six countries in 2010, 2015 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', '2010 (GJ)', '2015 (GJ)', '2022 (GJ)', 'Change 2010–2022 (%)'],
          rows: [
            { label: 'Iceland',     cells: [665, 672, 648, -3]  },
            { label: 'Canada',      cells: [420, 395, 388, -8]  },
            { label: 'USA',         cells: [310, 295, 280, -10] },
            { label: 'Germany',     cells: [172, 162, 148, -14] },
            { label: 'China',       cells: [72,  92,  112, +56] },
            { label: 'India',       cells: [22,  28,   34, +55] },
          ],
        },
      },
      {
        title: 'Organic Food Market Size and Growth – Seven Countries (2022)',
        instruction: 'The table below shows the organic food market size, per capita organic spending and market growth rate in seven countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Market Size ($bn)', 'Spend per Capita ($)', 'Organic Share of Food Market (%)', 'Annual Growth (%)'],
          rows: [
            { label: 'USA',         cells: [62.0, 186, 6.4, 8.4]  },
            { label: 'Germany',     cells: [17.8, 213, 7.2, 5.2]  },
            { label: 'France',      cells: [13.4, 196, 6.8, 7.0]  },
            { label: 'China',       cells: [10.8,   8, 1.2, 14.6] },
            { label: 'Switzerland', cells: [3.9,  453, 10.3, 4.1] },
            { label: 'UK',          cells: [3.6,   54, 3.8, 6.1]  },
            { label: 'Sweden',      cells: [2.1,  204, 9.6, 5.8]  },
          ],
        },
      },
      {
        title: 'Car Ownership per 1,000 People – Six Countries (2010 vs 2022)',
        instruction: 'The table below shows the number of registered passenger cars per 1,000 people in six countries in 2010 and 2022, and the change over this period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Cars/1,000 (2010)', 'Cars/1,000 (2022)', 'Change', 'EV Share of New Sales 2022 (%)'],
          rows: [
            { label: 'USA',       cells: [797, 838, '+41',  7.0]  },
            { label: 'Germany',   cells: [504, 578, '+74',  29.3] },
            { label: 'UK',        cells: [460, 510, '+50',  22.9] },
            { label: 'Japan',     cells: [591, 620, '+29',  3.2]  },
            { label: 'China',     cells: [58,  226, '+168', 25.6] },
            { label: 'Brazil',    cells: [178, 235, '+57',  2.1]  },
          ],
        },
      },
      {
        title: 'Trade Balance (Goods and Services, $bn) – Five Countries (2020–2022)',
        instruction: 'The table below shows the trade balance in goods, in services and the overall trade balance for five countries in 2020, 2021 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Goods Balance 2022 ($bn)', 'Services Balance 2022 ($bn)', 'Overall Balance 2022 ($bn)', 'Overall 2020 ($bn)'],
          rows: [
            { label: 'Germany', cells: [211,  -40, 171, 218]  },
            { label: 'China',   cells: [877, -105, 772, 524]  },
            { label: 'USA',     cells: [-1179, 286, -893, -648] },
            { label: 'UK',      cells: [-216,  140, -76, -97]  },
            { label: 'Japan',   cells: [-26,    40,  14, 37]   },
          ],
          note: 'Positive = surplus; negative = deficit.',
        },
      },
      {
        title: 'Average Primary School Class Size – Six Countries (2022)',
        instruction: 'The table below shows the average class size in primary schools, the pupil-to-teacher ratio, and the percentage of qualified teachers in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Avg Class Size', 'Pupil-to-Teacher Ratio', 'Qualified Teachers (%)', 'Govt Spend per Pupil ($)'],
          rows: [
            { label: 'Finland',  cells: [19.4, 13.1, 99, 11800] },
            { label: 'Japan',    cells: [26.8, 16.8, 100, 9200] },
            { label: 'UK',       cells: [27.2, 20.4, 96,  9800] },
            { label: 'USA',      cells: [24.9, 15.2, 94, 13200] },
            { label: 'Brazil',   cells: [28.4, 21.6, 77,  3200] },
            { label: 'India',    cells: [34.2, 26.5, 68,   860] },
          ],
        },
      },
      {
        title: 'Social Media Users by Platform and Region (2023)',
        instruction: 'The table below shows the number of active users (in millions) on five social media platforms across four world regions in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Platform', 'N. America (m)', 'Europe (m)', 'Asia-Pacific (m)', 'Rest of World (m)'],
          rows: [
            { label: 'Facebook',   cells: [272, 308, 1040, 530] },
            { label: 'Instagram',  cells: [168, 248,  614, 430] },
            { label: 'TikTok',     cells: [152, 180,  640, 370] },
            { label: 'LinkedIn',   cells: [220, 260,  280, 130] },
            { label: 'X (Twitter)',cells: [97,  98,   188,  92] },
          ],
        },
      },
      {
        title: 'Household Debt as a Percentage of Disposable Income – Six Countries (2022)',
        instruction: 'The table below shows household debt as a percentage of disposable income, the proportion accounted for by mortgages, and the average interest rate on new mortgages in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Household Debt (% disp. income)', 'Mortgage Share (%)', 'New Mortgage Rate (%)', 'Consumer Credit (% debt)'],
          rows: [
            { label: 'Denmark',     cells: [263, 88, 3.4, 12] },
            { label: 'Australia',   cells: [218, 86, 4.8, 14] },
            { label: 'Netherlands', cells: [215, 90, 3.6, 10] },
            { label: 'UK',          cells: [154, 82, 4.2, 18] },
            { label: 'USA',         cells: [147, 75, 5.2, 25] },
            { label: 'Germany',     cells: [100, 80, 3.1, 20] },
          ],
        },
      },
      {
        title: 'Threatened Species by Taxonomic Group and Region (2022)',
        instruction: 'The table below shows the number of threatened animal species across four taxonomic groups in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Total'],
          rows: [
            { label: 'SE Asia',            cells: [235, 280, 198, 246, 959]  },
            { label: 'S. America',         cells: [148, 262, 154, 340, 904]  },
            { label: 'Sub-Saharan Africa', cells: [206, 218, 112, 198, 734]  },
            { label: 'S. Asia',            cells: [120, 185,  94, 112, 511]  },
            { label: 'N. America',         cells: [68,   82,  72, 154, 376]  },
          ],
          note: 'IUCN Red List categories: Vulnerable, Endangered, Critically Endangered combined.',
        },
      },
      {
        title: 'Workplace Injury Rates by Industry – EU Countries (2021)',
        instruction: 'The table below shows the rate of non-fatal workplace injuries per 100,000 workers across five industries and three EU countries in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Industry', 'France', 'Germany', 'Spain', 'EU Average'],
          rows: [
            { label: 'Construction',    cells: [4820, 3140, 5680, 4200] },
            { label: 'Manufacturing',   cells: [2960, 2280, 3420, 2880] },
            { label: 'Agriculture',     cells: [3240, 2640, 3860, 3020] },
            { label: 'Transport',       cells: [2140, 1820, 2460, 2060] },
            { label: 'Retail',          cells: [1480, 1120, 1740, 1420] },
            { label: 'Healthcare',      cells: [1860, 1540, 2020, 1740] },
          ],
        },
      },
      {
        title: 'Electric Vehicle (EV) Market Share and Infrastructure – Six Countries (2022)',
        instruction: 'The table below shows the electric vehicle share of new car sales, the number of EV charging stations and the government EV purchase subsidy in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'EV Share of Sales (%)', 'Charging Stations (000s)', 'Govt Subsidy (USD equiv.)', 'EV Fleet (000s)'],
          rows: [
            { label: 'Norway',  cells: [79.3, 28.1, 7500,  670] },
            { label: 'Iceland', cells: [65.4,  2.0, 6200,   64] },
            { label: 'Sweden',  cells: [54.4, 14.6, 4200,  450] },
            { label: 'Germany', cells: [29.3, 82.4, 8000, 1400] },
            { label: 'UK',      cells: [22.9, 38.0, 5600,  820] },
            { label: 'USA',     cells: [7.0,  130.0, 7500, 2700] },
          ],
        },
      },
      {
        title: 'Scientific Research Output – Citations per Paper and Collaboration Rates by Country (2022)',
        instruction: 'The table below shows the total number of scientific publications, citations per paper, and international collaboration rate for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Publications (000s)', 'Citations/Paper', 'Intl Collaboration (%)', 'R&D Spend (% GDP)'],
          rows: [
            { label: 'USA',       cells: [612, 16.8, 34, 3.46] },
            { label: 'China',     cells: [954, 10.4, 22, 2.44] },
            { label: 'UK',        cells: [182, 17.2, 52, 1.74] },
            { label: 'Germany',   cells: [148, 15.6, 48, 3.17] },
            { label: 'Australia', cells: [84,  14.8, 56, 1.90] },
            { label: 'Brazil',    cells: [86,   8.4, 30, 1.16] },
          ],
        },
      },
      {
        title: 'Gender Pay Gap by Sector – UK (2022)',
        instruction: 'The table below shows the gender pay gap (difference between mean hourly earnings of men and women, as a percentage of men\'s earnings) across six employment sectors in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Sector', 'Mean Pay Gap (%)', 'Median Pay Gap (%)', 'Women in Senior Roles (%)', 'Women in Sector (%)'],
          rows: [
            { label: 'Finance & Insurance',  cells: [28.4, 24.6, 22, 52] },
            { label: 'Technology',           cells: [20.8, 17.4, 19, 28] },
            { label: 'Healthcare',           cells: [14.2, 10.8, 46, 77] },
            { label: 'Education',            cells: [8.6,   6.4, 38, 73] },
            { label: 'Retail',               cells: [7.4,   4.2, 34, 58] },
            { label: 'Manufacturing',        cells: [12.8, 10.6, 14, 24] },
          ],
          note: 'Positive gap = men earn more than women on average.',
        },
      },
      {
        title: 'Urban Transport Mode Share – Five Cities (2022)',
        instruction: 'The table below shows the percentage of daily commuting trips made by different transport modes in five major cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', 'Private Car (%)', 'Public Transport (%)', 'Cycling (%)', 'Walking (%)'],
          rows: [
            { label: 'Amsterdam', cells: [19, 24, 38, 19] },
            { label: 'Tokyo',     cells: [12, 48,  2, 18] },
            { label: 'London',    cells: [36, 41,  4, 19] },
            { label: 'Sydney',    cells: [58, 20,  2, 12] },
            { label: 'Dubai',     cells: [72, 13,  1,  5] },
          ],
          note: 'Remaining % = taxi/other modes.',
        },
      },
      {
        title: 'Remote Working Prevalence by Industry – Selected Countries (2022)',
        instruction: 'The table below shows the percentage of employees working remotely at least two days per week across five industries in four countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Industry', 'UK (%)', 'USA (%)', 'Germany (%)', 'Australia (%)'],
          rows: [
            { label: 'Technology & IT',  cells: [72, 78, 65, 71] },
            { label: 'Finance',          cells: [58, 64, 52, 56] },
            { label: 'Education',        cells: [34, 28, 30, 32] },
            { label: 'Healthcare',       cells: [12,  8, 10, 14] },
            { label: 'Manufacturing',    cells: [6,   4,  5,  7] },
            { label: 'Retail',           cells: [8,   6,  7, 10] },
          ],
        },
      },
      {
        title: 'Mental Health Disorder Prevalence (% of Population) – Six Countries (2022)',
        instruction: 'The table below shows the prevalence of four mental health disorders as a percentage of the population in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Anxiety (%)', 'Depression (%)', 'Bipolar (%)', 'Any Disorder (%)'],
          rows: [
            { label: 'USA',       cells: [18.1, 8.3, 2.8, 26.4] },
            { label: 'Brazil',    cells: [16.8, 9.3, 2.1, 23.4] },
            { label: 'Australia', cells: [14.4, 6.8, 1.8, 20.8] },
            { label: 'UK',        cells: [14.2, 6.4, 1.6, 20.1] },
            { label: 'Germany',   cells: [12.6, 5.8, 1.4, 18.2] },
            { label: 'Japan',     cells: [6.4,  3.2, 0.7, 10.8] },
          ],
        },
      },
      {
        title: 'Pharmaceutical Spending per Capita – Five Countries (2020–2022)',
        instruction: 'The table below shows pharmaceutical spending per capita in USD, the percentage of spending on branded versus generic drugs and the government reimbursement rate in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Spend/Capita ($)', 'Branded Drug Share (%)', 'Generic Share (%)', 'Govt Reimburse. (%)'],
          rows: [
            { label: 'USA',       cells: [1432, 72, 28, 35] },
            { label: 'Switzerland',cells: [924, 68, 32, 62] },
            { label: 'Germany',   cells: [786, 55, 45, 78] },
            { label: 'Japan',     cells: [624, 48, 52, 80] },
            { label: 'UK',        cells: [498, 42, 58, 88] },
            { label: 'India',     cells: [48,  26, 74, 20] },
          ],
        },
      },
      {
        title: 'Birth Rate, Death Rate and Natural Population Change – Six Countries (2022)',
        instruction: 'The table below shows the crude birth rate, crude death rate and rate of natural population change per 1,000 people in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Birth Rate/1,000', 'Death Rate/1,000', 'Natural Change/1,000', 'Total Fertility Rate'],
          rows: [
            { label: 'Niger',    cells: [48.2, 10.8, 37.4, 6.9] },
            { label: 'India',    cells: [17.4,  7.0, 10.4, 2.1] },
            { label: 'USA',      cells: [11.4,  8.8,  2.6, 1.7] },
            { label: 'France',   cells: [10.6,  9.4,  1.2, 1.8] },
            { label: 'Germany',  cells: [9.1,  11.4, -2.3, 1.5] },
            { label: 'Japan',    cells: [7.0,  11.4, -4.4, 1.2] },
          ],
          note: 'Natural change excludes migration.',
        },
      },
      {
        title: 'Government Tax Revenue as a Percentage of GDP – Six Countries (2022)',
        instruction: 'The table below shows total government tax revenue as a percentage of GDP, broken down into income tax, VAT/sales tax, social security contributions and other taxes, for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Total Tax (% GDP)', 'Income Tax (%)', 'VAT/Sales Tax (%)', 'Social Security (%)', 'Other (%)'],
          rows: [
            { label: 'Denmark', cells: [46.3, 25.0,  9.4,  1.1, 10.8] },
            { label: 'France',  cells: [45.4,  9.2,  7.6, 18.2, 10.4] },
            { label: 'Germany', cells: [39.0, 10.8,  7.0, 14.6,  6.6] },
            { label: 'UK',      cells: [33.0, 11.4,  6.8,  6.4,  8.4] },
            { label: 'USA',     cells: [26.6, 10.8,  2.1,  6.6,  7.1] },
            { label: 'Mexico',  cells: [16.4,  3.4,  3.8,  2.2,  7.0] },
          ],
        },
      },
      {
        title: 'Air Quality Index (AQI) and Pollution Sources – Major Cities (2022)',
        instruction: 'The table below shows the average annual Air Quality Index, fine particulate matter (PM2.5) concentration and the percentage contribution of key pollution sources for five cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', 'Avg AQI', 'PM2.5 (µg/m³)', 'Transport Share (%)', 'Industry Share (%)', 'Other (%)'],
          rows: [
            { label: 'Delhi',    cells: [186, 92.6, 28, 42, 30] },
            { label: 'Beijing',  cells: [138, 48.4, 31, 36, 33] },
            { label: 'Cairo',    cells: [116, 56.2, 22, 48, 30] },
            { label: 'São Paulo',cells: [72,  18.8, 42, 34, 24] },
            { label: 'London',   cells: [43,   9.6, 52, 18, 30] },
            { label: 'Stockholm',cells: [22,   5.1, 38, 16, 46] },
          ],
          note: 'AQI > 100 is considered unhealthy for sensitive groups.',
        },
      },
      {
        title: 'Pension System Coverage and Retirement Age – Six Countries (2023)',
        instruction: 'The table below shows the pension system coverage rate, the statutory retirement age for men and women, the average replacement rate (pension as % of pre-retirement income) and the pension funding level in six countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Coverage (% workforce)', 'Retirement Age (M/F)', 'Replacement Rate (%)', 'Fund Level (% GDP)'],
          rows: [
            { label: 'Netherlands', cells: [91, '67/67', 80.1, 180] },
            { label: 'Denmark',     cells: [89, '67/67', 75.4, 194] },
            { label: 'UK',          cells: [78, '66/66', 52.4,  96] },
            { label: 'USA',         cells: [64, '67/67', 49.4, 148] },
            { label: 'Brazil',      cells: [70, '65/62', 68.0,  20] },
            { label: 'India',       cells: [24, '60/58', 38.2,   8] },
          ],
        },
      },
      {
        title: 'Forest Cover Change by Country (2000–2020)',
        instruction: 'The table below shows the total forest area, the change in forest cover, the deforestation rate and the percentage of land covered by forest for six countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Forest Area 2020 (m ha)', 'Change 2000–2020 (m ha)', 'Deforestation Rate (%/yr)', 'Forest Cover (% land)'],
          rows: [
            { label: 'Russia',  cells: [815, -1.2,  0.01, 49.8] },
            { label: 'Brazil',  cells: [497, -64.4, 0.45, 58.9] },
            { label: 'Canada',  cells: [347, -0.8,  0.00, 38.2] },
            { label: 'China',   cells: [220, +24.4, -0.40, 22.9] },
            { label: 'USA',     cells: [310,  +4.2, -0.04, 33.9] },
            { label: 'Indonesia',cells: [92, -24.0,  0.72, 50.2] },
          ],
          note: 'Negative deforestation rate = net reforestation.',
        },
      },
      {
        title: 'Obesity Rates and Physical Inactivity – Six Countries (2022)',
        instruction: 'The table below shows obesity prevalence, physical inactivity rates and average daily caloric intake for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Obesity Rate (%)', 'Physical Inactivity (%)', 'Avg Daily Caloric Intake (kcal)'],
          rows: [
            { label: 'USA',       cells: [42.4, 40.0, 3800] },
            { label: 'UK',        cells: [28.0, 36.0, 3440] },
            { label: 'Australia', cells: [31.3, 30.0, 3210] },
            { label: 'Mexico',    cells: [36.1, 44.0, 3140] },
            { label: 'France',    cells: [21.6, 28.0, 3550] },
            { label: 'Japan',     cells: [4.3,  22.0, 2820] },
          ],
        },
      },
      {
        title: 'Seafood Consumption per Capita (kg/year) – Six Countries (2022)',
        instruction: 'The table below shows the per capita consumption of fish and seafood (in kg per year), the proportion from aquaculture versus wild catch and the main species consumed in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Total Seafood (kg/cap)', 'From Aquaculture (%)', 'From Wild Catch (%)', 'Top Species'],
          rows: [
            { label: 'South Korea',cells: [58.4, 38, 62, 'Seaweed, squid'] },
            { label: 'Japan',      cells: [50.2, 44, 56, 'Salmon, tuna']  },
            { label: 'Portugal',   cells: [56.8, 28, 72, 'Cod, sardines'] },
            { label: 'Norway',     cells: [52.1, 32, 68, 'Salmon, cod']   },
            { label: 'UK',         cells: [23.6, 30, 70, 'Salmon, tuna']  },
            { label: 'USA',        cells: [22.4, 36, 64, 'Shrimp, tuna']  },
          ],
        },
      },
      {
        title: 'Number of STEM Graduates per Million People – Six Countries (2021)',
        instruction: 'The table below shows the number of STEM (Science, Technology, Engineering and Mathematics) graduates per million people and the gender breakdown in six countries in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'STEM Graduates/million', 'Male (%)', 'Female (%)', 'Engineering Share (%)'],
          rows: [
            { label: 'S. Korea',   cells: [3840, 68, 32, 44] },
            { label: 'Germany',    cells: [2820, 66, 34, 40] },
            { label: 'Russia',     cells: [3120, 62, 38, 36] },
            { label: 'UK',         cells: [2240, 60, 40, 38] },
            { label: 'USA',        cells: [1980, 58, 42, 36] },
            { label: 'Brazil',     cells: [1340, 55, 45, 32] },
          ],
        },
      },
      {
        title: 'International Airline Passengers and Market Growth – Five Countries (2019–2022)',
        instruction: 'The table below shows the number of international airline passengers carried (in millions), the market share and the year-on-year growth rate for five countries in 2019 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', '2019 Passengers (m)', '2022 Passengers (m)', '% Recovery', 'Global Market Share 2022 (%)'],
          rows: [
            { label: 'USA',       cells: [925, 752, 81, 24.2] },
            { label: 'China',     cells: [660,  92, 14,  3.0] },
            { label: 'UK',        cells: [292, 248, 85,  8.0] },
            { label: 'UAE',       cells: [108, 142, 131, 4.6] },
            { label: 'Australia', cells: [64,   48, 75,  1.5] },
          ],
        },
      },
      {
        title: 'Digital Literacy by Age Group – Five Countries (2022)',
        instruction: 'The table below shows the percentage of people with basic, intermediate and advanced digital skills in three age groups across five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Basic Skills: 16–34 (%)', 'Basic Skills: 35–54 (%)', 'Basic Skills: 55–74 (%)', 'Advanced: 16–34 (%)'],
          rows: [
            { label: 'Finland',     cells: [98, 94, 76, 54] },
            { label: 'Netherlands', cells: [97, 90, 72, 48] },
            { label: 'UK',          cells: [92, 84, 64, 42] },
            { label: 'Germany',     cells: [90, 80, 58, 38] },
            { label: 'Italy',       cells: [78, 62, 38, 28] },
            { label: 'Romania',     cells: [72, 54, 28, 20] },
          ],
        },
      },
      {
        title: 'Gig Economy Worker Statistics – Five Countries (2022)',
        instruction: 'The table below shows the estimated percentage of workers engaged in gig or platform-based work, the proportion working full-time versus part-time in the gig economy and the median hourly earnings for gig workers in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Gig Workers (% workforce)', 'Full-time Gig (%)', 'Median Hourly Pay', 'YoY Growth (%)'],
          rows: [
            { label: 'USA',       cells: [16.4, 28, '$18.40', 8.2] },
            { label: 'UK',        cells: [14.8, 24, '£14.20', 7.4] },
            { label: 'Australia', cells: [12.6, 22, 'AUD$22', 6.8] },
            { label: 'Germany',   cells: [8.4,  18, '€16.80', 5.2] },
            { label: 'India',     cells: [4.2,  62, '₹320',   14.6] },
          ],
        },
      },
      {
        title: 'Languages: Number of Native Speakers (millions) (2023)',
        instruction: 'The table below shows the number of native speakers, total speakers (including second-language speakers) and the number of countries where each of seven major world languages is used as an official language. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Language', 'Native Speakers (m)', 'Total Speakers (m)', 'Official in (countries)', 'Language Family'],
          rows: [
            { label: 'Mandarin Chinese', cells: [940, 1120, 4,  'Sino-Tibetan'] },
            { label: 'Spanish',          cells: [485,  590, 21, 'Indo-European'] },
            { label: 'English',          cells: [380, 1460, 67, 'Indo-European'] },
            { label: 'Hindi',            cells: [345,  615,  1, 'Indo-European'] },
            { label: 'Arabic',           cells: [274,  380, 26, 'Afro-Asiatic']  },
            { label: 'French',           cells: [80,   280, 29, 'Indo-European'] },
            { label: 'Portuguese',       cells: [236,  270, 10, 'Indo-European'] },
          ],
        },
      },
      {
        title: 'Urban Green Space per Capita – Ten Cities (2022)',
        instruction: 'The table below shows the amount of public green space per capita, the percentage of city area covered by green space and the number of parks per 100,000 people in five cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['City', 'Green Space/Capita (m²)', 'Green Cover (% of city)', 'Parks per 100k residents'],
          rows: [
            { label: 'Vienna',    cells: [120.4, 45.5, 64] },
            { label: 'Singapore', cells: [66.2,  47.0, 28] },
            { label: 'London',    cells: [31.1,  33.0, 41] },
            { label: 'Tokyo',     cells: [6.7,   15.8, 18] },
            { label: 'Cairo',     cells: [0.8,    1.6,  4] },
            { label: 'Mumbai',    cells: [1.3,    2.4,  6] },
          ],
          note: 'WHO recommends at least 9 m² of green space per person.',
        },
      },
      {
        title: 'Disability Employment Gap – Five Countries (2022)',
        instruction: 'The table below shows the employment rate among people with and without disabilities, the resulting employment gap and the proportion of disabled people receiving government employment support in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Employment Rate: Disabled (%)', 'Employment Rate: Non-Disabled (%)', 'Gap (pp)', 'Govt Support Coverage (%)'],
          rows: [
            { label: 'Iceland',     cells: [78.2, 88.1, 9.9,  82] },
            { label: 'Sweden',      cells: [61.4, 83.2, 21.8, 74] },
            { label: 'UK',          cells: [52.6, 81.4, 28.8, 58] },
            { label: 'Germany',     cells: [56.8, 82.6, 25.8, 64] },
            { label: 'USA',         cells: [35.2, 77.8, 42.6, 40] },
            { label: 'Brazil',      cells: [28.6, 68.4, 39.8, 22] },
          ],
          note: 'pp = percentage points.',
        },
      },
      {
        title: 'National Debt as a Percentage of GDP – Six Countries (2022)',
        instruction: 'The table below shows the gross national debt as a percentage of GDP, the annual deficit/surplus and the debt-to-revenue ratio for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Gross Debt (% GDP)', 'Annual Deficit/Surplus (% GDP)', 'Debt/Revenue Ratio', 'Interest Payments (% revenue)'],
          rows: [
            { label: 'Japan',       cells: [261, -5.5, 4.6, 22.4] },
            { label: 'Greece',      cells: [177, -2.8, 3.2, 18.6] },
            { label: 'USA',         cells: [122, -5.8, 2.6, 14.2] },
            { label: 'Brazil',      cells: [88,  -7.1, 2.1, 28.4] },
            { label: 'UK',          cells: [102, -4.6, 2.2, 10.8] },
            { label: 'Germany',     cells: [66,  +2.8, 0.9,  3.4] },
          ],
          note: 'Negative deficit = surplus. Source: IMF World Economic Outlook 2022.',
        },
      },
      {
        title: 'Tourism Employment and Economic Contribution – Six Countries (2022)',
        instruction: 'The table below shows the contribution of tourism to GDP, the number of people employed in the tourism sector and international visitor spending in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Tourism (% GDP)', 'Tourism Jobs (m)', 'Visitor Spending ($bn)', 'Domestic vs Intl Visitors (%)'],
          rows: [
            { label: 'Thailand',    cells: [11.5, 4.2, 28.4, '35/65'] },
            { label: 'Spain',       cells: [12.4, 2.6, 73.9, '42/58'] },
            { label: 'France',      cells: [7.4,  2.8, 54.2, '55/45'] },
            { label: 'USA',         cells: [2.9,  8.8, 160.0, '72/28'] },
            { label: 'Australia',   cells: [3.1,  0.6, 32.8, '64/36'] },
            { label: 'Kenya',       cells: [8.6,  0.5,  1.7, '28/72'] },
          ],
        },
      },
      {
        title: 'Ocean and Marine Protected Area Coverage – Five Regions (2022)',
        instruction: 'The table below shows the total ocean area, the percentage under marine protected area (MPA) designation and the proportion of coastline protected in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Region', 'Ocean Area (m km²)', 'MPA Coverage (%)', 'Fully Protected MPAs (%)', 'Coastline Protected (%)'],
          rows: [
            { label: 'Oceania',     cells: [68.4, 28.4, 12.1, 42.6] },
            { label: 'N. America',  cells: [40.2, 22.8,  8.4, 34.2] },
            { label: 'Europe',      cells: [12.8, 12.4,  4.6, 28.6] },
            { label: 'S. America',  cells: [28.6,  8.2,  2.8, 18.4] },
            { label: 'Asia',        cells: [48.2,  4.8,  1.2, 12.6] },
            { label: 'Africa',      cells: [30.4,  3.6,  0.8,  8.4] },
          ],
          note: 'UN 30×30 target: 30% of oceans protected by 2030.',
        },
      },
      {
        title: 'E-Learning Platform Adoption – Six Countries (2022)',
        instruction: 'The table below shows the percentage of students using online learning platforms, the average weekly hours spent on e-learning and the government investment in digital education infrastructure in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Students Using E-Learning (%)', 'Avg Weekly Hours', 'Govt Digital Ed Spend ($m)', 'Platform Completion Rate (%)'],
          rows: [
            { label: 'USA',       cells: [82, 6.4, 4800, 42] },
            { label: 'China',     cells: [88, 8.2, 6200, 38] },
            { label: 'India',     cells: [64, 5.8, 1800, 28] },
            { label: 'UK',        cells: [78, 5.2, 1200, 46] },
            { label: 'Brazil',    cells: [58, 4.6,  820, 24] },
            { label: 'Nigeria',   cells: [34, 3.2,  140, 18] },
          ],
        },
      },
      {
        title: 'Household Food Waste by Stage of Supply Chain – Six Countries (2021)',
        instruction: 'The table below shows the amount of food wasted per person per year, the percentage of total food production wasted and the primary stage of the supply chain at which waste occurs in six countries in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Food Waste/Person (kg/yr)', 'Waste (% of production)', 'Highest Waste Stage', 'Economic Cost ($bn)'],
          rows: [
            { label: 'USA',       cells: [124, 30, 'Consumer',    218] },
            { label: 'UK',        cells: [95,  26, 'Consumer',     22] },
            { label: 'Australia', cells: [102, 28, 'Consumer',     20] },
            { label: 'China',     cells: [64,  22, 'Processing',  152] },
            { label: 'India',     cells: [50,  18, 'Post-harvest', 86] },
            { label: 'Ethiopia',  cells: [38,  28, 'Post-harvest',  4] },
          ],
        },
      },
      {
        title: 'Women in Senior Leadership Positions – Six Sectors (2023)',
        instruction: 'The table below shows the percentage of women in senior leadership roles across six economic sectors in four countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Sector', 'UK (%)', 'USA (%)', 'Japan (%)', 'Sweden (%)'],
          rows: [
            { label: 'Healthcare',  cells: [50, 48, 24, 62] },
            { label: 'Education',   cells: [44, 42, 20, 58] },
            { label: 'Finance',     cells: [28, 26, 10, 38] },
            { label: 'Technology',  cells: [22, 24,  8, 32] },
            { label: 'Government',  cells: [38, 34, 14, 48] },
            { label: 'Engineering', cells: [16, 18,  6, 26] },
          ],
        },
      },
      {
        title: 'Coffee and Tea Consumption per Capita (kg/year) – Six Countries (2022)',
        instruction: 'The table below shows the per capita annual consumption of coffee and tea in kilograms, and the average amount spent on these beverages, in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Coffee (kg/cap)', 'Tea (kg/cap)', 'Coffee Spend ($/yr)', 'Tea Spend ($/yr)'],
          rows: [
            { label: 'Finland',     cells: [12.0, 0.4, 240, 8]  },
            { label: 'Netherlands', cells: [8.4,  0.8, 168, 16] },
            { label: 'UK',          cells: [2.8,  1.8,  56, 36] },
            { label: 'India',       cells: [0.3,  0.8,   6, 16] },
            { label: 'Japan',       cells: [3.4,  0.9,  68, 18] },
            { label: 'Australia',   cells: [3.8,  0.9,  76, 18] },
          ],
        },
      },
      {
        title: 'Voter Turnout in National Elections – Six Democracies (Most Recent Election)',
        instruction: 'The table below shows voter turnout as a percentage of registered voters and of the voting-age population for six democracies, along with the type of voting system used and whether voting is compulsory. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Turnout (% registered)', 'Turnout (% voting-age pop.)', 'Voting System', 'Voting Compulsory?'],
          rows: [
            { label: 'Australia', cells: [89.4, 80.8, 'AV',          'Yes'] },
            { label: 'Belgium',   cells: [88.4, 79.6, 'PR list',      'Yes'] },
            { label: 'Germany',   cells: [76.6, 68.2, 'MMP',          'No']  },
            { label: 'UK',        cells: [67.3, 58.4, 'First-past-post','No'] },
            { label: 'France',    cells: [73.7, 64.8, 'Two-round',    'No']  },
            { label: 'USA',       cells: [66.8, 55.4, 'Electoral College','No'] },
          ],
        },
      },
      {
        title: 'Renewable Energy Investment and Capacity – Five Countries (2022)',
        instruction: 'The table below shows the investment in renewable energy, total installed renewable capacity and the annual growth in capacity for five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Investment ($bn)', 'Total Capacity (GW)', 'Solar Capacity (GW)', 'Wind Capacity (GW)', 'Capacity Growth (%/yr)'],
          rows: [
            { label: 'China',     cells: [758, 1190, 392, 365, 12.4] },
            { label: 'USA',       cells: [215,  390, 142, 148,  8.8] },
            { label: 'Germany',   cells: [46,   184,  66,  68,  4.2] },
            { label: 'India',     cells: [64,   178,  67,  44, 10.8] },
            { label: 'UK',        cells: [24,    72,  14,  28,  5.6] },
          ],
        },
      },
      {
        title: 'Minimum Wage as a Percentage of Median Wage – Six Countries (2022)',
        instruction: 'The table below shows the statutory minimum wage (in local currency and converted to USD), the minimum wage as a percentage of the median wage and the proportion of workers earning at or below the minimum wage in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'table',
          headers: ['Country', 'Minimum Wage (USD equiv./hr)', 'Min Wage (% of Median)', 'Workers at Min Wage (%)'],
          rows: [
            { label: 'Australia', cells: [14.62, 55.4, 6.8] },
            { label: 'France',    cells: [12.90, 62.1, 9.4] },
            { label: 'UK',        cells: [12.00, 58.8, 7.2] },
            { label: 'Germany',   cells: [11.10, 50.4, 6.0] },
            { label: 'USA',       cells: [7.25,  31.8, 1.4] },
            { label: 'India',     cells: [1.10,  48.2, 24.6] },
          ],
        },
      },
    ],
  },

  /* ═══════════════════ BAR CHART ═══════════════════ */
  {
    type: 'bar',
    label: 'Bar Chart',
    description: 'Analyse and compare quantities across groups or time periods.',
    color: 'emerald',
    prompts: [
      {
        title: 'International Student Enrolment – Four Countries (2010–2022)',
        instruction: 'The bar chart below shows the number of international students (in thousands) enrolled in universities in four English-speaking countries between 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Thousands of students',
          groups: ['2010', '2014', '2018', '2022'],
          series: [
            { name: 'UK',        color: '#3b82f6', values: [420, 490, 540, 620]  },
            { name: 'Australia', color: '#10b981', values: [310, 380, 440, 520]  },
            { name: 'Canada',    color: '#f59e0b', values: [240, 300, 380, 430]  },
            { name: 'USA',       color: '#8b5cf6', values: [680, 820, 950, 1050] },
          ],
        },
      },
      {
        title: 'Average Weekly Working Hours – Six Countries (2023)',
        instruction: 'The bar chart below shows the average number of hours worked per week by full-time employees in six countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Hours per week',
          groups: ['Germany', 'France', 'UK', 'USA', 'S. Korea', 'Mexico'],
          series: [
            { name: 'Avg. Weekly Hours', color: '#6366f1', values: [34.2, 36.1, 38.5, 41.3, 45.7, 48.5] },
          ],
        },
      },
      {
        title: 'Annual Entertainment Spending per Person – Three Countries (2021)',
        instruction: 'The bar chart below shows the average annual spending (in USD) per person on four types of entertainment in the UK, USA, and South Korea in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'USD per person per year',
          groups: ['Cinema', 'Streaming', 'Music', 'Live Events'],
          series: [
            { name: 'UK',          color: '#ef4444', values: [85,  180, 60, 145] },
            { name: 'USA',         color: '#3b82f6', values: [120, 220, 75, 210] },
            { name: 'South Korea', color: '#10b981', values: [65,  140, 90, 80]  },
          ],
        },
      },
      {
        title: 'Average Broadband Download Speed (Mbps) – Eight Countries (2023)',
        instruction: 'The bar chart below shows the average broadband download speed in megabits per second for eight countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Mbps (megabits per second)',
          groups: ['Singapore', 'Denmark', 'S. Korea', 'USA', 'UK', 'Australia', 'Brazil', 'India'],
          series: [
            { name: 'Avg Download Speed', color: '#3b82f6', values: [292, 256, 248, 218, 186, 162, 98, 72] },
          ],
        },
      },
      {
        title: 'CO₂ Emissions per Capita (tonnes) – Seven Countries (2022)',
        instruction: 'The bar chart below shows the CO₂ emissions per capita in tonnes for seven countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Tonnes of CO₂ per person',
          groups: ['Qatar', 'Australia', 'USA', 'Germany', 'China', 'Brazil', 'India'],
          series: [
            { name: 'CO₂ per Capita', color: '#ef4444', values: [32.4, 14.7, 14.2, 7.8, 8.1, 2.3, 1.9] },
          ],
        },
      },
      {
        title: 'Voter Turnout in Most Recent National Elections – Six Countries',
        instruction: 'The bar chart below shows the voter turnout as a percentage of registered voters in the most recent national parliamentary or presidential election in six countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of registered voters',
          groups: ['Belgium', 'Australia', 'Denmark', 'Germany', 'France', 'USA'],
          series: [
            { name: 'Voter Turnout', color: '#8b5cf6', values: [89.4, 88.2, 84.6, 76.6, 73.7, 66.8] },
          ],
        },
      },
      {
        title: 'Tourism Revenue as a Percentage of GDP – Six Countries (2022)',
        instruction: 'The bar chart below shows the contribution of international tourism receipts as a percentage of GDP for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of GDP',
          groups: ['Thailand', 'Spain', 'Greece', 'France', 'Australia', 'Germany'],
          series: [
            { name: 'Tourism Revenue', color: '#22c55e', values: [11.5, 12.4, 14.8, 7.4, 3.1, 1.8] },
          ],
        },
      },
      {
        title: 'Renewable Energy Share of Electricity Generation – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of total electricity generation coming from renewable sources in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total electricity generation',
          groups: ['Norway', 'Denmark', 'Germany', 'Spain', 'UK', 'USA'],
          series: [
            { name: 'Renewable Share', color: '#22c55e', values: [92, 88, 49, 52, 43, 22] },
          ],
        },
      },
      {
        title: 'Women in Parliament – Six Countries (2023)',
        instruction: 'The bar chart below shows the percentage of seats in the national parliament held by women in six countries in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of parliamentary seats',
          groups: ['Iceland', 'New Zealand', 'Sweden', 'Finland', 'UK', 'Japan'],
          series: [
            { name: 'Women MPs', color: '#ec4899', values: [47.6, 50.0, 46.4, 46.0, 35.2, 9.7] },
          ],
        },
      },
      {
        title: 'Prison Population Rate – Six Countries (2022)',
        instruction: 'The bar chart below shows the number of prisoners per 100,000 people in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Prisoners per 100,000 population',
          groups: ['USA', 'Brazil', 'Russia', 'UK', 'Germany', 'Japan'],
          series: [
            { name: 'Prison Rate', color: '#64748b', values: [639, 381, 308, 134, 74, 38] },
          ],
        },
      },
      {
        title: 'Obesity Prevalence – Seven Countries (2022)',
        instruction: 'The bar chart below shows the percentage of adults classified as obese (BMI ≥ 30) in seven countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of adult population',
          groups: ['USA', 'Mexico', 'Australia', 'UK', 'Germany', 'France', 'Japan'],
          series: [
            { name: 'Obesity Rate', color: '#f97316', values: [42.4, 36.1, 31.3, 28.0, 22.3, 21.6, 4.3] },
          ],
        },
      },
      {
        title: 'Cycling Modal Share of Urban Commuting – Seven Cities (2022)',
        instruction: 'The bar chart below shows the percentage of daily commuting trips made by bicycle in seven major cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of daily commuting trips',
          groups: ['Utrecht', 'Copenhagen', 'Amsterdam', 'Berlin', 'Tokyo', 'London', 'Sydney'],
          series: [
            { name: 'Cycling Mode Share', color: '#22c55e', values: [58, 49, 38, 18, 2, 4, 2] },
          ],
        },
      },
      {
        title: 'Average Annual Happiness Index Score – Six Countries (2023)',
        instruction: 'The bar chart below shows the average self-reported happiness index score (scale 0–10) for six countries in 2023, based on the World Happiness Report. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Score (0–10 scale)',
          groups: ['Finland', 'Denmark', 'Iceland', 'Netherlands', 'UK', 'USA'],
          series: [
            { name: 'Happiness Score', color: '#eab308', values: [7.80, 7.59, 7.53, 7.42, 6.80, 6.72] },
          ],
        },
      },
      {
        title: 'Average Daily Screen Time – Six Countries (2022)',
        instruction: 'The bar chart below shows the average number of hours per day spent on screens (smartphones, TV and computers combined) by adults in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Hours per day',
          groups: ['Philippines', 'Brazil', 'South Africa', 'USA', 'UK', 'Japan'],
          series: [
            { name: 'Daily Screen Time', color: '#8b5cf6', values: [10.5, 9.1, 8.6, 7.4, 6.8, 4.2] },
          ],
        },
      },
      {
        title: 'Average Commute Time – Seven Cities (2022)',
        instruction: 'The bar chart below shows the average one-way commute time in minutes for workers in seven major cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Minutes (one-way)',
          groups: ['Mumbai', 'Dhaka', 'Johannesburg', 'Beijing', 'London', 'New York', 'Berlin'],
          series: [
            { name: 'Avg Commute Time', color: '#06b6d4', values: [58, 64, 52, 48, 43, 46, 32] },
          ],
        },
      },
      {
        title: 'Daily Newspaper Readership per 1,000 People – Six Countries (2022)',
        instruction: 'The bar chart below shows the number of daily newspaper copies sold per 1,000 people in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Copies per 1,000 people',
          groups: ['Japan', 'Norway', 'Germany', 'UK', 'Australia', 'USA'],
          series: [
            { name: 'Newspaper Copies', color: '#64748b', values: [316, 248, 186, 124, 92, 64] },
          ],
        },
      },
      {
        title: 'Number of UNESCO World Heritage Sites – Six Countries (2023)',
        instruction: 'The bar chart below shows the number of UNESCO World Heritage Sites designated in six countries as of 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Number of sites',
          groups: ['Italy', 'China', 'Germany', 'Spain', 'France', 'UK'],
          series: [
            { name: 'Heritage Sites', color: '#f59e0b', values: [58, 57, 52, 50, 52, 33] },
          ],
        },
      },
      {
        title: 'Child Poverty Rate – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of children living below the national poverty line in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of children in poverty',
          groups: ['USA', 'UK', 'Australia', 'Germany', 'France', 'Finland'],
          series: [
            { name: 'Child Poverty Rate', color: '#ef4444', values: [17.8, 18.6, 12.8, 10.3, 9.2, 3.6] },
          ],
        },
      },
      {
        title: 'E-Waste Generated per Capita (kg) – Six Countries (2022)',
        instruction: 'The bar chart below shows the amount of electronic waste generated per capita in kilograms for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'kg of e-waste per person',
          groups: ['Norway', 'Australia', 'Netherlands', 'UK', 'USA', 'China'],
          series: [
            { name: 'E-Waste per Capita', color: '#84cc16', values: [28.4, 23.6, 22.8, 24.6, 21.2, 7.2] },
          ],
        },
      },
      {
        title: 'Foreign Aid as a Percentage of GNI – Six Donor Countries (2022)',
        instruction: 'The bar chart below shows official development assistance as a percentage of gross national income (GNI) for six donor countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of GNI',
          groups: ['Sweden', 'Norway', 'Germany', 'France', 'UK', 'USA'],
          series: [
            { name: 'Aid as % of GNI', color: '#22c55e', values: [0.93, 0.82, 0.83, 0.56, 0.51, 0.22] },
          ],
        },
      },
      {
        title: 'Average Sleep Duration per Night – Six Countries (2022)',
        instruction: 'The bar chart below shows the average number of hours slept per night by adults in six countries in 2022, based on self-reported data. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Hours per night',
          groups: ['France', 'USA', 'UK', 'Australia', 'Germany', 'Japan'],
          series: [
            { name: 'Avg Sleep Hours', color: '#6366f1', values: [7.13, 6.88, 6.84, 7.02, 7.06, 6.47] },
          ],
        },
      },
      {
        title: 'Patent Applications per Million People – Six Countries (2022)',
        instruction: 'The bar chart below shows the number of patent applications filed per million people for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Patent applications per million people',
          groups: ['S. Korea', 'Japan', 'USA', 'Germany', 'China', 'UK'],
          series: [
            { name: 'Patents per Million', color: '#3b82f6', values: [3842, 2936, 1828, 1642, 1124, 682] },
          ],
        },
      },
      {
        title: 'Percentage of Land Covered by National Parks – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of total land area designated as national park or protected nature reserve in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total land area',
          groups: ['Costa Rica', 'Tanzania', 'Namibia', 'Germany', 'UK', 'China'],
          series: [
            { name: 'National Park Land', color: '#22c55e', values: [26.8, 38.2, 44.1, 8.6, 28.4, 18.2] },
          ],
        },
      },
      {
        title: 'Public Transport Modal Share of Urban Commuting – Six Cities (2022)',
        instruction: 'The bar chart below shows the percentage of daily commuting trips made by public transport in six major cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of daily commuting trips',
          groups: ['Singapore', 'Tokyo', 'London', 'Paris', 'Sydney', 'Los Angeles'],
          series: [
            { name: 'Public Transport Share', color: '#3b82f6', values: [66, 48, 41, 44, 20, 8] },
          ],
        },
      },
      {
        title: 'Cigarette Consumption per Adult per Year – Six Countries (2022)',
        instruction: 'The bar chart below shows the estimated number of cigarettes consumed per adult per year in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Cigarettes per adult per year',
          groups: ['China', 'Indonesia', 'Russia', 'USA', 'UK', 'Australia'],
          series: [
            { name: 'Cigarette Consumption', color: '#94a3b8', values: [3146, 1782, 2118, 1082, 744, 512] },
          ],
        },
      },
      {
        title: 'Suicide Rate per 100,000 Population – Six Countries (2022)',
        instruction: 'The bar chart below shows the age-standardised suicide rate per 100,000 population for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Suicides per 100,000 population',
          groups: ['Guyana', 'Russia', 'South Korea', 'Japan', 'USA', 'UK'],
          series: [
            { name: 'Suicide Rate', color: '#64748b', values: [29.2, 18.4, 20.6, 13.8, 13.2, 6.8] },
          ],
        },
      },
      {
        title: 'Museum and Cultural Site Visits per Capita – Six Countries (2022)',
        instruction: 'The bar chart below shows the average number of museum and cultural site visits per person per year in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Visits per person per year',
          groups: ['France', 'Italy', 'UK', 'Germany', 'USA', 'Australia'],
          series: [
            { name: 'Museum Visits per Capita', color: '#a78bfa', values: [0.86, 0.92, 0.68, 0.44, 0.27, 0.38] },
          ],
        },
      },
      {
        title: 'Population Density – Six Countries (2022)',
        instruction: 'The bar chart below shows the average population density in people per square kilometre for six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'People per km²',
          groups: ['Bangladesh', 'S. Korea', 'Netherlands', 'UK', 'Germany', 'Australia'],
          series: [
            { name: 'Population Density', color: '#f59e0b', values: [1284, 527, 508, 278, 240, 3] },
          ],
        },
      },
      {
        title: 'Books Published per Million People – Six Countries (2022)',
        instruction: 'The bar chart below shows the number of new book titles published per million people in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'New titles per million people',
          groups: ['UK', 'Australia', 'USA', 'Germany', 'France', 'Brazil'],
          series: [
            { name: 'Books Published', color: '#8b5cf6', values: [2848, 1962, 1486, 1284, 992, 482] },
          ],
        },
      },
      {
        title: 'Male vs Female Literacy Rate – Six Regions (2022)',
        instruction: 'The bar chart below shows the literacy rate for males and females aged 15 and above in six world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of adults (15+) who are literate',
          groups: ['N. America', 'E. Asia', 'Latin Am.', 'SE Asia', 'S. Asia', 'W. Africa'],
          series: [
            { name: 'Male',   color: '#3b82f6', values: [99.0, 98.0, 93.8, 93.6, 82.4, 66.8] },
            { name: 'Female', color: '#ec4899', values: [98.8, 97.2, 93.6, 91.4, 65.8, 54.2] },
          ],
        },
      },
      {
        title: 'Urban vs Rural Poverty Rate – Six Developing Countries (2022)',
        instruction: 'The bar chart below shows the poverty rate (% of population below the national poverty line) in urban and rural areas for six developing countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of population in poverty',
          groups: ['India', 'Nigeria', 'Brazil', 'Bangladesh', 'Ethiopia', 'Vietnam'],
          series: [
            { name: 'Urban Poverty',  color: '#3b82f6', values: [8.6,  22.4, 10.2, 6.8, 18.4, 2.8]  },
            { name: 'Rural Poverty',  color: '#22c55e', values: [24.8, 48.6, 28.4, 22.6, 44.8, 14.2] },
          ],
        },
      },
      {
        title: 'Public vs Private Healthcare Spending – Six Countries (% of GDP, 2022)',
        instruction: 'The bar chart below shows public and private healthcare spending as a percentage of GDP in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of GDP',
          groups: ['USA', 'Germany', 'France', 'UK', 'Canada', 'Japan'],
          series: [
            { name: 'Public Spending',  color: '#3b82f6', values: [8.6, 9.8, 9.4, 8.8, 8.2, 8.4]  },
            { name: 'Private Spending', color: '#ef4444', values: [8.2, 3.0, 2.8, 1.4, 2.4, 2.6]  },
          ],
        },
      },
      {
        title: 'Male vs Female STEM University Enrollment – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of all university students enrolled in STEM subjects who are male or female in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of STEM university enrollment',
          groups: ['UK', 'USA', 'Germany', 'S. Korea', 'India', 'Brazil'],
          series: [
            { name: 'Male',   color: '#3b82f6', values: [60, 58, 66, 68, 68, 55] },
            { name: 'Female', color: '#ec4899', values: [40, 42, 34, 32, 32, 45] },
          ],
        },
      },
      {
        title: 'Tourist Arrivals: Domestic vs International – Five Countries (2022)',
        instruction: 'The bar chart below shows the number of domestic and international tourist trips (in millions) in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Millions of trips',
          groups: ['China', 'USA', 'India', 'France', 'Thailand'],
          series: [
            { name: 'Domestic Tourists',       color: '#3b82f6', values: [2480, 2180, 1400, 240, 78]  },
            { name: 'International Tourists',  color: '#f97316', values: [2, 51, 12, 79, 22] },
          ],
        },
      },
      {
        title: 'Renewable vs Fossil-Fuel Electricity Production – Six Countries (TWh, 2022)',
        instruction: 'The bar chart below shows the amount of electricity generated from renewable sources and from fossil fuels (in terawatt-hours) in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Terawatt-hours (TWh)',
          groups: ['China', 'USA', 'India', 'Germany', 'Brazil', 'UK'],
          series: [
            { name: 'Renewables',   color: '#22c55e', values: [2848, 868, 494, 254, 618, 138] },
            { name: 'Fossil Fuels', color: '#64748b', values: [4842, 2468, 1486, 284, 128, 84]  },
          ],
        },
      },
      {
        title: 'New Petrol vs Electric Car Sales – Five Countries (2022)',
        instruction: 'The bar chart below shows the number of new petrol/diesel cars and new battery-electric vehicles sold (in thousands) in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Thousands of vehicles sold',
          groups: ['China', 'USA', 'Germany', 'UK', 'Norway'],
          series: [
            { name: 'Petrol/Diesel', color: '#64748b', values: [15480, 11248, 2184, 1246, 28] },
            { name: 'Electric (BEV)',color: '#22c55e', values: [5920,  808,  832,  268, 138] },
          ],
        },
      },
      {
        title: 'Wild Catch vs Aquaculture Fish Production – Five Countries (million tonnes, 2022)',
        instruction: 'The bar chart below shows the volume of fish produced through wild catch and through aquaculture (in million tonnes) in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Million tonnes',
          groups: ['China', 'Indonesia', 'India', 'Norway', 'Japan'],
          series: [
            { name: 'Wild Catch',  color: '#3b82f6', values: [13.2, 6.8, 5.4, 2.4, 3.1] },
            { name: 'Aquaculture', color: '#22c55e', values: [61.8, 5.2, 6.2, 1.8, 0.6] },
          ],
        },
      },
      {
        title: 'Working Remotely vs In-Office – Five Industries (UK, 2022)',
        instruction: 'The bar chart below shows the percentage of employees working primarily from home versus primarily in the office across five industries in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of employees',
          groups: ['Technology', 'Finance', 'Education', 'Healthcare', 'Retail'],
          series: [
            { name: 'Mainly Remote', color: '#3b82f6', values: [72, 58, 34, 12, 8]  },
            { name: 'Mainly Office', color: '#f97316', values: [28, 42, 66, 88, 92] },
          ],
        },
      },
      {
        title: 'Recycling Rate vs Waste Sent to Landfill – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of municipal waste that is recycled and the percentage sent to landfill in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total municipal waste',
          groups: ['Germany', 'South Korea', 'UK', 'USA', 'Brazil', 'India'],
          series: [
            { name: 'Recycled',       color: '#22c55e', values: [67, 59, 46, 32, 22, 14] },
            { name: 'Sent to Landfill',color: '#ef4444', values: [1,  16, 24, 52, 59, 70] },
          ],
        },
      },
      {
        title: 'Primary vs Secondary School Completion Rate – Five Regions (2022)',
        instruction: 'The bar chart below shows the percentage of children completing primary and lower-secondary education in five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of relevant age group',
          groups: ['E. Asia', 'Latin Am.', 'S. Asia', 'M. East & N. Africa', 'Sub-Saharan Africa'],
          series: [
            { name: 'Primary',           color: '#3b82f6', values: [97, 95, 91, 93, 74] },
            { name: 'Lower Secondary',   color: '#22c55e', values: [95, 92, 81, 84, 62] },
          ],
        },
      },
      {
        title: 'Urban vs Rural Internet Access Rate – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of the urban and rural population with internet access in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of population with internet access',
          groups: ['UK', 'Brazil', 'India', 'Nigeria', 'China', 'Indonesia'],
          series: [
            { name: 'Urban', color: '#3b82f6', values: [97, 91, 78, 64, 92, 84] },
            { name: 'Rural', color: '#22c55e', values: [93, 66, 42, 28, 74, 62] },
          ],
        },
      },
      {
        title: 'Male vs Female Sports Participation Rate – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of men and women who participate in sport at least once a week in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of adult population',
          groups: ['Finland', 'USA', 'Australia', 'UK', 'Brazil', 'Japan'],
          series: [
            { name: 'Male',   color: '#3b82f6', values: [68, 54, 62, 52, 44, 48] },
            { name: 'Female', color: '#ec4899', values: [64, 48, 58, 46, 34, 38] },
          ],
        },
      },
      {
        title: 'National Park Visitors – Pre- vs Post-Pandemic (Five Countries, 2019 vs 2022)',
        instruction: 'The bar chart below shows the number of visitors to national parks (in millions) in five countries in 2019 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Millions of visitors',
          groups: ['USA', 'France', 'Australia', 'UK', 'South Africa'],
          series: [
            { name: '2019', color: '#3b82f6', values: [328, 186, 64, 142, 22]  },
            { name: '2022', color: '#22c55e', values: [312, 156, 58, 164, 26]  },
          ],
        },
      },
      {
        title: 'Reading vs Maths PISA Score – Five Countries (2022)',
        instruction: 'The bar chart below shows the average PISA scores in reading and mathematics for five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'PISA average score',
          groups: ['Singapore', 'Japan', 'Canada', 'UK', 'USA'],
          series: [
            { name: 'Reading',     color: '#3b82f6', values: [574, 516, 507, 494, 504] },
            { name: 'Mathematics', color: '#f97316', values: [575, 536, 497, 489, 465] },
          ],
        },
      },
      {
        title: 'Hospital Beds per 1,000 People – 2000 vs 2022 (Six Countries)',
        instruction: 'The bar chart below shows the number of hospital beds per 1,000 people in six countries in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Hospital beds per 1,000 people',
          groups: ['Japan', 'Germany', 'France', 'UK', 'USA', 'Brazil'],
          series: [
            { name: '2000', color: '#94a3b8', values: [14.8, 9.2, 8.4, 4.1, 3.6, 2.8] },
            { name: '2022', color: '#3b82f6', values: [13.0, 8.0, 5.9, 2.5, 2.9, 2.2] },
          ],
        },
      },
      {
        title: 'Agricultural vs Domestic Water Consumption – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of total freshwater withdrawals used by the agricultural sector and for domestic household purposes in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total freshwater withdrawals',
          groups: ['India', 'USA', 'China', 'Australia', 'UK', 'Germany'],
          series: [
            { name: 'Agriculture', color: '#22c55e', values: [88, 42, 64, 72, 11, 18] },
            { name: 'Domestic',    color: '#3b82f6', values: [6,  12, 10, 14, 22, 16] },
          ],
        },
      },
      {
        title: 'Homeowners vs Renters as % of Population – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of households that own their home and the percentage renting in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of households',
          groups: ['Romania', 'Spain', 'UK', 'USA', 'Germany', 'Switzerland'],
          series: [
            { name: 'Homeowners', color: '#22c55e', values: [96, 76, 64, 66, 51, 42] },
            { name: 'Renters',    color: '#f97316', values: [4,  24, 36, 34, 49, 58] },
          ],
        },
      },
      {
        title: 'Exports: Goods vs Services – Five Countries ($bn, 2022)',
        instruction: 'The bar chart below shows the total value of goods exports and services exports (in billions of USD) for five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'USD billions',
          groups: ['China', 'USA', 'Germany', 'UK', 'India'],
          series: [
            { name: 'Goods Exports',    color: '#3b82f6', values: [3594, 1754, 1576, 474, 424]  },
            { name: 'Services Exports', color: '#22c55e', values: [362,  1002, 364,  426, 322]  },
          ],
        },
      },
      {
        title: 'Mental Health: Treated vs Untreated Disorders – Five Regions (2022)',
        instruction: 'The bar chart below shows the percentage of people with a mental health disorder who received treatment versus those who did not, across five world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of people with a mental health disorder',
          groups: ['N. America', 'W. Europe', 'Latin Am.', 'E. Asia', 'Sub-Sah. Africa'],
          series: [
            { name: 'Received Treatment', color: '#3b82f6', values: [44, 38, 28, 12, 8]  },
            { name: 'No Treatment',       color: '#ef4444', values: [56, 62, 72, 88, 92] },
          ],
        },
      },
      {
        title: 'University Enrollment: Arts & Humanities vs STEM – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of all university students enrolled in arts and humanities subjects versus STEM subjects in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of university students',
          groups: ['UK', 'USA', 'Germany', 'Japan', 'S. Korea', 'India'],
          series: [
            { name: 'Arts & Humanities', color: '#a78bfa', values: [22, 18, 14, 20, 12, 10] },
            { name: 'STEM',              color: '#3b82f6', values: [38, 34, 48, 42, 54, 60] },
          ],
        },
      },
      {
        title: 'Solar vs Wind Installed Capacity – Five Countries (GW, 2022)',
        instruction: 'The bar chart below shows the total installed solar photovoltaic and wind energy capacity in gigawatts for five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Gigawatts (GW)',
          groups: ['China', 'USA', 'Germany', 'India', 'UK'],
          series: [
            { name: 'Solar PV', color: '#eab308', values: [392, 142, 66, 67, 14] },
            { name: 'Wind',     color: '#22c55e', values: [365, 148, 68, 44, 28] },
          ],
        },
      },
      {
        title: 'Property Crime vs Violent Crime Rate – Six Countries (per 100k, 2022)',
        instruction: 'The bar chart below shows the rate of property crime and violent crime per 100,000 people in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Incidents per 100,000 population',
          groups: ['USA', 'UK', 'Australia', 'Germany', 'Japan', 'Brazil'],
          series: [
            { name: 'Property Crime', color: '#f59e0b', values: [1958, 3248, 2862, 1648, 1088, 848]  },
            { name: 'Violent Crime',  color: '#ef4444', values: [367,  556,  440,  278,  28,   752]  },
          ],
        },
      },
      {
        title: 'Full-Time vs Part-Time Employment – Six Countries (% of workforce, 2022)',
        instruction: 'The bar chart below shows the percentage of the workforce in full-time and part-time employment in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total workforce',
          groups: ['Japan', 'Netherlands', 'UK', 'Germany', 'USA', 'France'],
          series: [
            { name: 'Full-Time',  color: '#3b82f6', values: [73, 60, 74, 73, 83, 80] },
            { name: 'Part-Time',  color: '#f97316', values: [27, 40, 26, 27, 17, 20] },
          ],
        },
      },
      {
        title: 'Inflation vs Wage Growth – Six Countries (%, 2022)',
        instruction: 'The bar chart below shows the consumer price inflation rate and average nominal wage growth rate in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% annual rate',
          groups: ['Argentina', 'Turkey', 'UK', 'USA', 'Germany', 'Japan'],
          series: [
            { name: 'Inflation',   color: '#ef4444', values: [72.4, 72.3, 10.1, 8.0, 8.7, 2.5] },
            { name: 'Wage Growth', color: '#22c55e', values: [48.6, 44.2, 5.8,  5.1, 4.2, 1.8] },
          ],
        },
      },
      {
        title: 'Meat vs Plant-Based Food Sales – Five Countries (Annual Growth %, 2022)',
        instruction: 'The bar chart below shows the annual sales growth rate (%) of conventional meat and plant-based food products in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Annual sales growth (%)',
          groups: ['Germany', 'UK', 'USA', 'Australia', 'Brazil'],
          series: [
            { name: 'Conventional Meat',  color: '#ef4444', values: [2.4, 1.8, 3.2, 2.8, 4.6]  },
            { name: 'Plant-Based Foods',  color: '#22c55e', values: [18.4, 14.6, 12.8, 22.4, 8.2] },
          ],
        },
      },
      {
        title: 'Physical vs Digital Library Loans – Five Countries (millions, 2022)',
        instruction: 'The bar chart below shows the number of physical book loans and digital e-book loans (in millions) from public libraries in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Millions of loans',
          groups: ['USA', 'Germany', 'UK', 'Denmark', 'Australia'],
          series: [
            { name: 'Physical Loans', color: '#3b82f6', values: [498, 146, 164, 42, 52]  },
            { name: 'Digital Loans',  color: '#22c55e', values: [182,  48,  86, 28, 36]  },
          ],
        },
      },
      {
        title: 'Coffee vs Tea Consumption per Capita (kg/year) – Six Countries (2022)',
        instruction: 'The bar chart below shows the average per capita annual consumption of coffee and tea in kilograms in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'kg per person per year',
          groups: ['Finland', 'Netherlands', 'UK', 'Japan', 'India', 'China'],
          series: [
            { name: 'Coffee', color: '#92400e', values: [12.0, 8.4, 2.8, 3.4, 0.3, 0.1] },
            { name: 'Tea',    color: '#22c55e', values: [0.4,  0.8, 1.8, 0.9, 0.8, 0.6] },
          ],
        },
      },
      {
        title: 'Aid Received: Bilateral vs Multilateral – Five Developing Countries ($bn, 2022)',
        instruction: 'The bar chart below shows the amount of official development assistance received from bilateral (government-to-government) and multilateral (e.g. UN, World Bank) sources by five developing countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'USD billions',
          groups: ['Ethiopia', 'Bangladesh', 'Nigeria', 'Kenya', 'Afghanistan'],
          series: [
            { name: 'Bilateral Aid',    color: '#3b82f6', values: [2.4, 1.8, 1.4, 2.1, 3.8] },
            { name: 'Multilateral Aid', color: '#22c55e', values: [1.8, 2.2, 0.8, 1.4, 2.1] },
          ],
        },
      },
      {
        title: 'Employment by Sector: Services, Industry and Agriculture – Five Countries (2022)',
        instruction: 'The bar chart below shows the percentage of the workforce employed in the services, industry and agriculture sectors in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total workforce',
          groups: ['USA', 'UK', 'Germany', 'India', 'Nigeria'],
          series: [
            { name: 'Services',    color: '#3b82f6', values: [80, 82, 70, 32, 36] },
            { name: 'Industry',    color: '#f97316', values: [19, 16, 28, 26, 22] },
            { name: 'Agriculture', color: '#22c55e', values: [1,   2,  2, 42, 42] },
          ],
        },
      },
      {
        title: 'Education Spending: Primary, Secondary and Higher Education – Five Countries (% of total, 2022)',
        instruction: 'The bar chart below shows how five countries allocate their total public education spending across primary, secondary and higher education levels as a percentage of total education spending in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total public education spending',
          groups: ['USA', 'Germany', 'UK', 'Brazil', 'India'],
          series: [
            { name: 'Primary',           color: '#22c55e', values: [22, 28, 24, 34, 38] },
            { name: 'Secondary',         color: '#3b82f6', values: [28, 32, 30, 38, 34] },
            { name: 'Higher Education',  color: '#8b5cf6', values: [50, 40, 46, 28, 28] },
          ],
        },
      },
      {
        title: 'Waste Management: Recycling, Incineration and Landfill – Five Countries (2022)',
        instruction: 'The bar chart below shows the percentage of total municipal waste treated by recycling, energy-from-waste incineration and landfill in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total municipal solid waste',
          groups: ['Germany', 'Netherlands', 'UK', 'USA', 'Brazil'],
          series: [
            { name: 'Recycling',    color: '#22c55e', values: [67, 52, 46, 32, 22] },
            { name: 'Incineration', color: '#f97316', values: [32, 42, 28, 16,  8] },
            { name: 'Landfill',     color: '#64748b', values: [1,   6, 26, 52, 70] },
          ],
        },
      },
      {
        title: 'Electricity Sources: Fossil Fuels, Nuclear and Renewables – Six Countries (2022)',
        instruction: 'The bar chart below shows the percentage of total electricity generation coming from fossil fuels, nuclear power and renewable energy sources in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total electricity generation',
          groups: ['France', 'Germany', 'UK', 'USA', 'China', 'India'],
          series: [
            { name: 'Fossil Fuels', color: '#64748b', values: [16, 51, 57, 61, 70, 81] },
            { name: 'Nuclear',      color: '#8b5cf6', values: [71,  6,  8, 18,  5,  3] },
            { name: 'Renewables',   color: '#22c55e', values: [13, 43, 35, 21, 25, 16] },
          ],
        },
      },
      {
        title: 'New Car Sales: Petrol, Hybrid and Electric – Five Countries (thousands, 2022)',
        instruction: 'The bar chart below shows the number of new petrol/diesel, hybrid and battery-electric cars sold (in thousands) in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Thousands of cars sold',
          groups: ['China', 'USA', 'Germany', 'UK', 'Norway'],
          series: [
            { name: 'Petrol/Diesel', color: '#64748b', values: [15480, 11248, 2184, 1246, 28]  },
            { name: 'Hybrid',        color: '#f59e0b', values: [2840,  2124, 428,  186, 26]  },
            { name: 'Electric (BEV)',color: '#22c55e', values: [5920,   808, 832,  268, 138] },
          ],
        },
      },
      {
        title: 'Tourism Type: Cultural, Nature and Beach/Resort – Five Countries (% of visitors, 2022)',
        instruction: 'The bar chart below shows the percentage of international tourists visiting for cultural, nature-based and beach/resort tourism in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of international visitors',
          groups: ['Italy', 'Kenya', 'Thailand', 'France', 'Australia'],
          series: [
            { name: 'Cultural',     color: '#a78bfa', values: [62, 12, 18, 58, 28] },
            { name: 'Nature',       color: '#22c55e', values: [14, 62, 22, 18, 44] },
            { name: 'Beach/Resort', color: '#f59e0b', values: [24, 26, 60, 24, 28] },
          ],
        },
      },
      {
        title: 'Housing Types: Owner-Occupied, Private Rented and Social Housing – Five Countries (2022)',
        instruction: 'The bar chart below shows the percentage of the housing stock that is owner-occupied, privately rented and social (affordable) housing in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total housing stock',
          groups: ['Netherlands', 'UK', 'Germany', 'France', 'USA'],
          series: [
            { name: 'Owner-Occupied',   color: '#22c55e', values: [56, 64, 51, 58, 66] },
            { name: 'Private Rented',   color: '#f97316', values: [22, 20, 38, 28, 28] },
            { name: 'Social Housing',   color: '#3b82f6', values: [22, 16, 11, 14,  6] },
          ],
        },
      },
      {
        title: 'Transport CO₂ Emissions: Road, Aviation and Shipping – Five Countries (2022)',
        instruction: 'The bar chart below shows the CO₂ emissions (in millions of tonnes) from road transport, aviation and shipping in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Millions of tonnes CO₂',
          groups: ['USA', 'China', 'Germany', 'UK', 'Australia'],
          series: [
            { name: 'Road',     color: '#64748b', values: [1648, 1042, 162, 112, 98]  },
            { name: 'Aviation', color: '#3b82f6', values: [248,  168,  62,  44, 22]  },
            { name: 'Shipping', color: '#06b6d4', values: [88,   124,  28,  16, 14]  },
          ],
        },
      },
      {
        title: 'Daily Screen Time: TV, Social Media and Gaming – Five Countries (hours, 2022)',
        instruction: 'The bar chart below shows the average hours spent per day watching television, using social media and playing video games by adults in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Hours per day per adult',
          groups: ['USA', 'Brazil', 'UK', 'South Korea', 'Japan'],
          series: [
            { name: 'TV',           color: '#64748b', values: [3.1, 3.8, 3.2, 2.4, 3.6] },
            { name: 'Social Media', color: '#3b82f6', values: [2.3, 3.2, 1.9, 1.8, 0.9] },
            { name: 'Gaming',       color: '#8b5cf6', values: [1.1, 1.4, 1.2, 2.1, 1.8] },
          ],
        },
      },
      {
        title: 'Protein Sources: Meat, Fish and Plant-Based – Five Countries (% of dietary protein, 2022)',
        instruction: 'The bar chart below shows the percentage of dietary protein intake derived from meat, fish and plant-based sources in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total dietary protein intake',
          groups: ['Argentina', 'USA', 'Germany', 'India', 'Japan'],
          series: [
            { name: 'Meat',        color: '#ef4444', values: [54, 48, 44, 8, 28]  },
            { name: 'Fish',        color: '#3b82f6', values: [8,  12, 12, 6, 38]  },
            { name: 'Plant-Based', color: '#22c55e', values: [38, 40, 44, 86, 34] },
          ],
        },
      },
      {
        title: 'Work Patterns: Office-Only, Hybrid and Fully Remote – Five Industries (UK, 2023)',
        instruction: 'The bar chart below shows the percentage of workers in five UK industries working exclusively in the office, on a hybrid basis and fully remotely in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of employees in each industry',
          groups: ['Finance', 'Technology', 'Legal', 'Healthcare', 'Construction'],
          series: [
            { name: 'Office-Only', color: '#64748b', values: [28, 16, 32, 76, 88] },
            { name: 'Hybrid',      color: '#3b82f6', values: [52, 54, 48, 18,  8] },
            { name: 'Fully Remote',color: '#22c55e', values: [20, 30, 20,  6,  4] },
          ],
        },
      },
      {
        title: 'Healthcare Spending: Hospitals, Primary Care and Administration – Five Countries (% of health budget, 2022)',
        instruction: 'The bar chart below shows how five countries allocate their total public health spending across hospitals, primary care/community services and administrative costs as a percentage of the total health budget in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total public health budget',
          groups: ['UK', 'Germany', 'France', 'Australia', 'Canada'],
          series: [
            { name: 'Hospitals',    color: '#ef4444', values: [48, 52, 46, 50, 44]  },
            { name: 'Primary Care', color: '#22c55e', values: [32, 28, 34, 30, 36]  },
            { name: 'Admin & Other',color: '#64748b', values: [20, 20, 20, 20, 20]  },
          ],
        },
      },
      {
        title: 'Government Funding Breakdown: Govt, Private and Charity – Five Sectors (UK, 2022)',
        instruction: 'The bar chart below shows the percentage of funding from government, private and charitable sources in five public service sectors in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total sector funding',
          groups: ['Health', 'Education', 'Social Care', 'Arts & Culture', 'Sport'],
          series: [
            { name: 'Government', color: '#3b82f6', values: [82, 68, 52, 34, 28] },
            { name: 'Private',    color: '#f97316', values: [12, 24, 34, 42, 52] },
            { name: 'Charitable', color: '#22c55e', values: [6,   8, 14, 24, 20] },
          ],
        },
      },
      {
        title: 'Spending on Arts, Sports and Libraries – Five Countries (USD per capita, 2022)',
        instruction: 'The bar chart below shows the government spending per capita on arts and culture, sport facilities and public libraries in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'USD per capita',
          groups: ['Norway', 'Germany', 'UK', 'Australia', 'USA'],
          series: [
            { name: 'Arts & Culture', color: '#a78bfa', values: [248, 182, 124, 96, 72]  },
            { name: 'Sport',          color: '#22c55e', values: [186, 142, 98,  84, 48]  },
            { name: 'Libraries',      color: '#3b82f6', values: [124, 98,  72,  62, 44]  },
          ],
        },
      },
      {
        title: 'Food Expenditure: Fresh, Processed and Eating Out – Five Countries (% of food budget, 2022)',
        instruction: 'The bar chart below shows the percentage of the household food budget spent on fresh produce, processed/packaged food and eating out in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of household food budget',
          groups: ['France', 'Japan', 'UK', 'USA', 'Brazil'],
          series: [
            { name: 'Fresh Produce',  color: '#22c55e', values: [44, 48, 32, 28, 52] },
            { name: 'Processed Food', color: '#f97316', values: [28, 24, 38, 42, 26] },
            { name: 'Eating Out',     color: '#a78bfa', values: [28, 28, 30, 30, 22] },
          ],
        },
      },
      {
        title: 'Population Change: Births, Deaths and Net Migration – Five Countries (per 1,000, 2022)',
        instruction: 'The bar chart below shows the crude birth rate, death rate and net migration rate per 1,000 population for five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Rate per 1,000 population',
          groups: ['Niger', 'India', 'UK', 'Germany', 'Japan'],
          series: [
            { name: 'Birth Rate',       color: '#22c55e', values: [48.2, 17.4, 10.6, 9.1, 7.0]  },
            { name: 'Death Rate',       color: '#ef4444', values: [10.8,  7.0,  9.4, 11.4, 11.4] },
            { name: 'Net Migration',    color: '#3b82f6', values: [0.1,   0.4,  4.8,  4.2, 0.7]  },
          ],
        },
      },
      {
        title: 'Higher Education Graduates: STEM, Business and Humanities – Five Countries (% of graduates, 2022)',
        instruction: 'The bar chart below shows the percentage of all higher education graduates who studied STEM, Business and management, or Arts, Humanities and Social Sciences in five countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of all university graduates',
          groups: ['India', 'China', 'Germany', 'UK', 'USA'],
          series: [
            { name: 'STEM',              color: '#3b82f6', values: [60, 52, 48, 38, 34] },
            { name: 'Business & Mgt.',   color: '#f59e0b', values: [22, 28, 26, 32, 36] },
            { name: 'Arts & Humanities', color: '#a78bfa', values: [18, 20, 26, 30, 30] },
          ],
        },
      },
      {
        title: 'Road, Rail and Air Freight Volume – Five Countries (billion tonne-km, 2022)',
        instruction: 'The bar chart below shows the volume of freight transported by road, rail and air in five countries in 2022, measured in billion tonne-kilometres. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Billion tonne-kilometres',
          groups: ['USA', 'China', 'India', 'Germany', 'UK'],
          series: [
            { name: 'Road', color: '#64748b', values: [2348, 6248, 2142, 348, 186]  },
            { name: 'Rail', color: '#3b82f6', values: [2528, 3042, 1042, 128, 24]   },
            { name: 'Air',  color: '#06b6d4', values: [42,   82,   12,   14, 12]    },
          ],
        },
      },
      {
        title: 'Carbon Emission Sources: Energy, Industry and Transport – Six Countries (% of total, 2022)',
        instruction: 'The bar chart below shows the percentage of each country\'s total CO₂ emissions attributable to the energy sector, industry and transport in six countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: '% of total national CO₂ emissions',
          groups: ['China', 'India', 'USA', 'Germany', 'UK', 'Brazil'],
          series: [
            { name: 'Energy Generation', color: '#ef4444', values: [51, 48, 38, 42, 32, 22] },
            { name: 'Industry',          color: '#64748b', values: [28, 24, 22, 24, 18, 36] },
            { name: 'Transport',         color: '#3b82f6', values: [10, 14, 28, 22, 32, 18] },
          ],
        },
      },
      {
        title: 'Tourist Spending per Visit: Accommodation, Food and Activities – Five Cities (2022)',
        instruction: 'The bar chart below shows the average amount spent per visit by international tourists on accommodation, food and drink, and cultural activities/tours in five cities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'USD per tourist visit',
          groups: ['London', 'Paris', 'Dubai', 'Bangkok', 'Barcelona'],
          series: [
            { name: 'Accommodation', color: '#3b82f6', values: [892, 784, 1128, 384, 512]  },
            { name: 'Food & Drink',  color: '#f59e0b', values: [348, 398,  448, 218, 288]  },
            { name: 'Activities',    color: '#22c55e', values: [284, 348,  568, 148, 224]  },
          ],
        },
      },
      {
        title: 'Water Usage: Residential, Agricultural and Industrial – Six Countries (km³/yr, 2022)',
        instruction: 'The bar chart below shows the volume of freshwater used per year by the residential, agricultural and industrial sectors in six countries, measured in cubic kilometres. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'bar',
          unit: 'Cubic kilometres per year (km³/yr)',
          groups: ['India', 'USA', 'China', 'Brazil', 'Germany', 'Australia'],
          series: [
            { name: 'Agricultural',  color: '#22c55e', values: [688, 198, 358, 142, 4.8, 14.2] },
            { name: 'Industrial',    color: '#64748b', values: [18,  48,  62,  16, 5.2, 2.8]   },
            { name: 'Residential',   color: '#3b82f6', values: [42,  38,  48,  18, 3.4, 4.6]   },
          ],
        },
      },
    ],
  },

  /* ═══════════════════ LINE GRAPH ═══════════════════ */
  {
    type: 'line',
    label: 'Line Graph',
    description: 'Describe trends and changes over a period of time.',
    color: 'violet',
    prompts: [
      {
        title: 'Internet Usage by World Region (2000–2020)',
        instruction: 'The line graph below shows the percentage of the population using the internet in four regions between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of population',
          xValues: ['2000', '2005', '2010', '2015', '2020'],
          series: [
            { name: 'North America',      color: '#3b82f6', values: [48, 65, 77, 88, 95] },
            { name: 'Western Europe',     color: '#22c55e', values: [32, 52, 70, 82, 92] },
            { name: 'East Asia',          color: '#f97316', values: [22, 38, 55, 72, 88] },
            { name: 'Sub-Saharan Africa', color: '#ef4444', values: [1,  3,  8,  18, 32] },
          ],
        },
      },
      {
        title: 'Birth Rate and Death Rate in Country X (1950–2020)',
        instruction: 'The line graph below shows the birth rate and death rate per 1,000 people in Country X from 1950 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Rate per 1,000 people',
          xValues: ['1950','1960','1970','1980','1990','2000','2010','2020'],
          series: [
            { name: 'Birth Rate', color: '#3b82f6', values: [38, 35, 30, 25, 20, 16, 13, 11] },
            { name: 'Death Rate', color: '#ef4444', values: [22, 18, 14, 10, 9,  8,  8,  9]  },
          ],
        },
      },
      {
        title: 'Average House Prices – Three Cities (2005–2022)',
        instruction: 'The line graph below shows the average house price (in thousands of local currency) in London, Sydney, and Toronto between 2005 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Price (thousands of local currency)',
          xValues: ['2005','2008','2011','2014','2017','2019','2022'],
          series: [
            { name: 'London (£)',    color: '#ef4444', values: [185, 210, 240, 290, 480, 460, 520] },
            { name: 'Sydney (AUD)', color: '#f97316', values: [420, 500, 480, 620, 880, 790, 950] },
            { name: 'Toronto (CAD)',color: '#3b82f6', values: [295, 340, 390, 450, 730, 680, 810] },
          ],
        },
      },
      {
        title: 'Atmospheric CO₂ Concentration (ppm) (1960–2022)',
        instruction: 'The line graph below shows the average annual concentration of carbon dioxide in the atmosphere (in parts per million) from 1960 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Parts per million (ppm)',
          xValues: ['1960','1970','1980','1990','2000','2010','2022'],
          series: [
            { name: 'CO₂ Concentration', color: '#ef4444', values: [317, 326, 339, 354, 370, 390, 421] },
          ],
        },
      },
      {
        title: 'Global Electric Vehicle Sales (millions) (2013–2022)',
        instruction: 'The line graph below shows the number of battery electric vehicles sold worldwide (in millions) from 2013 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions of EVs sold',
          xValues: ['2013','2015','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Global EV Sales', color: '#22c55e', values: [0.09, 0.35, 1.02, 1.98, 2.21, 3.24, 6.58, 10.52] },
          ],
        },
      },
      {
        title: 'Global Installed Renewable Energy Capacity (GW) (2010–2022)',
        instruction: 'The line graph below shows the total installed renewable energy capacity worldwide (in gigawatts) from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Gigawatts (GW)',
          xValues: ['2010','2012','2014','2016','2018','2020','2022'],
          series: [
            { name: 'Total Renewable Capacity', color: '#22c55e', values: [1248, 1578, 1868, 2244, 2652, 3264, 3372] },
          ],
        },
      },
      {
        title: 'Global Smartphone Users (billions) (2013–2022)',
        instruction: 'The line graph below shows the estimated number of smartphone users worldwide (in billions) from 2013 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Billions of users',
          xValues: ['2013','2015','2016','2017','2018','2019','2020','2022'],
          series: [
            { name: 'Smartphone Users', color: '#3b82f6', values: [1.84, 2.49, 2.79, 3.04, 3.37, 3.53, 3.68, 6.64] },
          ],
        },
      },
      {
        title: 'Global Refugee Population (millions) (2000–2022)',
        instruction: 'The line graph below shows the total number of refugees worldwide (in millions) under the UNHCR mandate from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions of refugees',
          xValues: ['2000','2005','2010','2015','2018','2020','2022'],
          series: [
            { name: 'Global Refugee Population', color: '#f97316', values: [12.1, 8.7, 10.5, 16.1, 20.4, 26.4, 35.3] },
          ],
        },
      },
      {
        title: 'Global Mean Sea Level Rise (mm above 1993 baseline) (2000–2022)',
        instruction: 'The line graph below shows the rise in global mean sea level (in millimetres above the 1993 baseline) from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millimetres (mm) above 1993 baseline',
          xValues: ['2000','2004','2008','2012','2016','2019','2022'],
          series: [
            { name: 'Sea Level Rise', color: '#06b6d4', values: [18, 27, 38, 52, 68, 78, 101] },
          ],
        },
      },
      {
        title: 'UK Consumer Price Inflation Rate (%) (2014–2023)',
        instruction: 'The line graph below shows the annual consumer price inflation rate in the UK from 2014 to 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% annual change in CPI',
          xValues: ['2014','2016','2017','2018','2020','2021','2022','2023'],
          series: [
            { name: 'UK Inflation (CPI)', color: '#ef4444', values: [1.5, 0.6, 2.7, 2.5, 0.9, 2.5, 10.1, 6.7] },
          ],
        },
      },
      {
        title: 'Global Malaria Deaths (thousands) (2000–2021)',
        instruction: 'The line graph below shows the estimated number of malaria deaths worldwide (in thousands) from 2000 to 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Thousands of deaths',
          xValues: ['2000','2005','2010','2015','2018','2020','2021'],
          series: [
            { name: 'Global Malaria Deaths', color: '#8b5cf6', values: [898, 786, 622, 446, 411, 627, 619] },
          ],
        },
      },
      {
        title: 'Antarctic Sea Ice Minimum Annual Extent (million km²) (2005–2022)',
        instruction: 'The line graph below shows the annual minimum sea ice extent in the Antarctic (in millions of square kilometres) from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Million km²',
          xValues: ['2005','2008','2011','2014','2017','2019','2022'],
          series: [
            { name: 'Antarctic Sea Ice Minimum', color: '#06b6d4', values: [3.24, 3.01, 2.98, 3.47, 2.18, 3.02, 1.92] },
          ],
        },
      },
      {
        title: 'Global Average Temperature Anomaly (°C above pre-industrial average) (1980–2022)',
        instruction: 'The line graph below shows the global average surface temperature anomaly (in °C above the pre-industrial average) from 1980 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '°C above pre-industrial (1850–1900) average',
          xValues: ['1980','1990','2000','2005','2010','2016','2020','2022'],
          series: [
            { name: 'Temperature Anomaly', color: '#ef4444', values: [0.27, 0.45, 0.62, 0.68, 0.72, 1.02, 1.02, 1.15] },
          ],
        },
      },
      {
        title: 'Global E-Commerce Sales ($trillion) (2015–2022)',
        instruction: 'The line graph below shows the total value of global retail e-commerce sales (in trillions of USD) from 2015 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'USD trillions',
          xValues: ['2015','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Global E-Commerce Sales', color: '#3b82f6', values: [1.55, 1.86, 2.30, 2.86, 3.35, 4.28, 4.93, 5.78] },
          ],
        },
      },
      {
        title: 'UK Prison Population (thousands) (2000–2022)',
        instruction: 'The line graph below shows the total number of people held in prison in England and Wales (in thousands) from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Thousands of prisoners',
          xValues: ['2000','2004','2008','2012','2016','2019','2022'],
          series: [
            { name: 'UK Prison Population', color: '#64748b', values: [64.6, 74.9, 83.2, 86.6, 85.8, 82.8, 88.2] },
          ],
        },
      },
      {
        title: 'Global Music Streaming Revenue ($bn) (2015–2022)',
        instruction: 'The line graph below shows the total global revenue from music streaming services (in billions of USD) from 2015 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'USD billions',
          xValues: ['2015','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Streaming Revenue', color: '#8b5cf6', values: [2.0, 3.6, 6.6, 8.9, 11.4, 13.4, 16.9, 19.8] },
          ],
        },
      },
      {
        title: 'Number of Active Satellites in Earth Orbit (2010–2022)',
        instruction: 'The line graph below shows the total number of active satellites in Earth orbit from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Number of active satellites',
          xValues: ['2010','2013','2015','2017','2019','2021','2022'],
          series: [
            { name: 'Active Satellites', color: '#06b6d4', values: [958, 1084, 1381, 1886, 2218, 4852, 6718] },
          ],
        },
      },
      {
        title: 'Global Number of Billionaires (2010–2023)',
        instruction: 'The line graph below shows the total number of billionaires worldwide from 2010 to 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Number of billionaires',
          xValues: ['2010','2012','2014','2016','2018','2020','2022','2023'],
          series: [
            { name: 'Number of Billionaires', color: '#eab308', values: [1011, 1226, 1645, 1810, 2208, 2095, 2668, 2640] },
          ],
        },
      },
      {
        title: 'Global Organic Farmland Area (million hectares) (2000–2021)',
        instruction: 'The line graph below shows the total area of certified organic farmland worldwide (in millions of hectares) from 2000 to 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Million hectares (Mha)',
          xValues: ['2000','2004','2008','2012','2015','2018','2021'],
          series: [
            { name: 'Organic Farmland', color: '#22c55e', values: [15.8, 26.4, 35.2, 43.1, 50.9, 71.5, 76.4] },
          ],
        },
      },
      {
        title: 'World Literacy Rate (%) (1990–2022)',
        instruction: 'The line graph below shows the global adult literacy rate (percentage of people aged 15 and above who can read and write) from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of adults (15+)',
          xValues: ['1990','1995','2000','2005','2010','2015','2020','2022'],
          series: [
            { name: 'Global Literacy Rate', color: '#3b82f6', values: [76.2, 78.4, 81.6, 83.2, 85.4, 86.8, 87.2, 87.0] },
          ],
        },
      },
      {
        title: 'CO₂ Emissions per Capita: EU vs USA (1990–2022)',
        instruction: 'The line graph below shows the CO₂ emissions per capita (in tonnes) for the European Union and the United States from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Tonnes of CO₂ per person',
          xValues: ['1990','1995','2000','2005','2010','2015','2019','2022'],
          series: [
            { name: 'EU Average',  color: '#3b82f6', values: [10.2, 9.4, 9.1, 8.8, 7.8, 6.9, 6.2, 5.8]  },
            { name: 'USA',         color: '#ef4444', values: [19.4, 19.8, 20.6, 19.8, 17.2, 16.2, 15.4, 14.2] },
          ],
        },
      },
      {
        title: 'Male vs Female Life Expectancy at Birth – Japan (1970–2022)',
        instruction: 'The line graph below shows the life expectancy at birth for males and females in Japan from 1970 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Years',
          xValues: ['1970','1980','1990','2000','2010','2015','2022'],
          series: [
            { name: 'Male',   color: '#3b82f6', values: [69.3, 73.4, 75.9, 77.7, 79.6, 80.8, 81.1] },
            { name: 'Female', color: '#ec4899', values: [74.7, 78.8, 81.9, 84.6, 86.3, 87.1, 87.1] },
          ],
        },
      },
      {
        title: 'Cinema vs Streaming Revenue – Global (2012–2022)',
        instruction: 'The line graph below shows the global box-office revenue and the global subscription video streaming revenue (in billions of USD) from 2012 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'USD billions',
          xValues: ['2012','2014','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Global Box Office', color: '#f97316', values: [34.7, 36.4, 38.6, 40.6, 41.7, 42.5, 12.1, 21.3, 32.0] },
            { name: 'Streaming Revenue', color: '#3b82f6', values: [3.8,  7.2,  12.6, 18.4, 26.8, 38.4, 52.6, 64.8, 72.4] },
          ],
        },
      },
      {
        title: 'Cycling vs Car Commute Modal Share – Netherlands (1980–2022)',
        instruction: 'The line graph below shows the percentage of all commuting trips made by bicycle and by private car in the Netherlands from 1980 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of all commuting trips',
          xValues: ['1980','1990','2000','2005','2010','2015','2022'],
          series: [
            { name: 'Cycling', color: '#22c55e', values: [28, 32, 36, 38, 40, 44, 48] },
            { name: 'Car',     color: '#64748b', values: [58, 54, 50, 48, 46, 44, 40] },
          ],
        },
      },
      {
        title: 'Organic vs Conventional Food Sales Growth – Germany (2012–2022)',
        instruction: 'The line graph below shows the annual sales growth rate (%) of organic and conventional food products in Germany from 2012 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Annual sales growth (%)',
          xValues: ['2012','2014','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Organic Food',      color: '#22c55e', values: [6.4, 5.8, 7.2, 8.4, 5.6, 9.8, 22.4, 6.2, 5.2]  },
            { name: 'Conventional Food', color: '#64748b', values: [3.2, 2.8, 2.2, 2.4, 2.8, 1.4,  5.8, 1.8, 1.6]  },
          ],
        },
      },
      {
        title: 'University Applications vs Available Places – UK (2005–2022)',
        instruction: 'The line graph below shows the total number of university applications received and the total number of places offered in UK higher education from 2005 to 2022 (in thousands). Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Thousands',
          xValues: ['2005','2008','2011','2014','2017','2019','2021','2022'],
          series: [
            { name: 'Applications',      color: '#ef4444', values: [472, 518, 648, 584, 649, 732, 742, 738] },
            { name: 'Accepted Places',   color: '#3b82f6', values: [358, 388, 448, 470, 529, 543, 564, 542] },
          ],
        },
      },
      {
        title: 'Internet Users: Developed vs Developing World (%) (2000–2022)',
        instruction: 'The line graph below shows the percentage of the population using the internet in developed and developing countries from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of population',
          xValues: ['2000','2005','2010','2015','2018','2020','2022'],
          series: [
            { name: 'Developed Countries',   color: '#3b82f6', values: [44, 64, 76, 84, 88, 91, 92] },
            { name: 'Developing Countries',  color: '#f97316', values: [2,  8,  19, 35, 47, 54, 61] },
          ],
        },
      },
      {
        title: 'Inflation vs Average Wage Growth – UK (2016–2023)',
        instruction: 'The line graph below shows the annual consumer price inflation rate and the average nominal wage growth rate in the UK from 2016 to 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% annual rate',
          xValues: ['2016','2017','2018','2019','2020','2021','2022','2023'],
          series: [
            { name: 'Inflation (CPI)', color: '#ef4444', values: [0.7, 2.7, 2.5, 1.8, 0.9, 2.5, 10.1, 6.7] },
            { name: 'Wage Growth',     color: '#22c55e', values: [2.4, 2.6, 3.2, 3.8, 2.0, 3.8,  5.8, 6.9] },
          ],
        },
      },
      {
        title: 'Child Mortality Rate vs Vaccination Coverage – Global (1990–2022)',
        instruction: 'The line graph below shows the global under-five child mortality rate (per 1,000 live births) and the global DTP3 vaccination coverage rate (%) from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Rate (see labels)',
          xValues: ['1990','1995','2000','2005','2010','2015','2020','2022'],
          series: [
            { name: 'Child Mortality/1,000 births', color: '#ef4444', values: [93, 84, 76, 64, 50, 42, 38, 37] },
            { name: 'Vaccination Coverage (%)',     color: '#22c55e', values: [72, 74, 78, 82, 84, 86, 82, 84] },
          ],
        },
      },
      {
        title: 'Air Passenger Numbers vs Aviation CO₂ – Global (2000–2022)',
        instruction: 'The line graph below shows the total number of global airline passengers (in billions) and the CO₂ emissions from aviation (in millions of tonnes) from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Passengers (bn) / CO₂ (million tonnes)',
          xValues: ['2000','2005','2010','2014','2017','2019','2020','2022'],
          series: [
            { name: 'Passengers (bn)',       color: '#3b82f6', values: [1.7, 2.0, 2.7, 3.3, 4.1, 4.5, 1.8, 3.8] },
            { name: 'CO₂ (m tonnes)',        color: '#ef4444', values: [468, 538, 648, 728, 860, 915, 368, 792] },
          ],
        },
      },
      {
        title: 'Female Workforce Participation vs Total Fertility Rate – OECD Average (1970–2020)',
        instruction: 'The line graph below shows the average female labour force participation rate and the average total fertility rate (births per woman) across OECD countries from 1970 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'See axis labels',
          xValues: ['1970','1980','1990','2000','2010','2015','2020'],
          series: [
            { name: 'Female Workforce Participation (%)', color: '#ec4899', values: [44.2, 49.8, 56.4, 60.8, 62.4, 64.8, 64.2] },
            { name: 'Total Fertility Rate (births/woman)', color: '#3b82f6', values: [2.82, 2.16, 1.84, 1.66, 1.72, 1.68, 1.59] },
          ],
        },
      },
      {
        title: 'Solar Panel Cost vs Global Installations – (2010–2022)',
        instruction: 'The line graph below shows the average cost of solar photovoltaic panels (USD per watt) and the total global solar capacity installed (in gigawatts) from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Cost ($/W) and Capacity (GW)',
          xValues: ['2010','2012','2014','2016','2017','2018','2020','2022'],
          series: [
            { name: 'Solar Panel Cost ($/W)',    color: '#ef4444', values: [1.96, 0.88, 0.61, 0.42, 0.36, 0.24, 0.18, 0.14] },
            { name: 'Installed Capacity (GW)',   color: '#eab308', values: [40,   99, 181,  302, 402,  512, 714, 1053] },
          ],
        },
      },
      {
        title: 'Mobile Phone Subscriptions vs Fixed Landlines – World (2000–2022)',
        instruction: 'The line graph below shows the number of mobile phone subscriptions and fixed telephone landlines per 100 people worldwide from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Subscriptions per 100 people',
          xValues: ['2000','2005','2008','2010','2012','2015','2018','2022'],
          series: [
            { name: 'Mobile Subscriptions', color: '#3b82f6', values: [12, 34, 60, 78, 88, 99, 107, 108] },
            { name: 'Fixed Landlines',      color: '#64748b', values: [18, 20, 20, 18, 16, 14, 11,   9] },
          ],
        },
      },
      {
        title: 'Public Transport Trips vs Private Car Use – London (2005–2022)',
        instruction: 'The line graph below shows the total annual number of public transport trips (in billions) and the vehicle kilometres travelled by private car (in billions) in Greater London from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Billions',
          xValues: ['2005','2008','2011','2014','2016','2019','2020','2022'],
          series: [
            { name: 'Public Transport Trips (bn)',  color: '#3b82f6', values: [3.2, 3.6, 3.9, 4.0, 4.1, 4.1, 1.6, 3.5] },
            { name: 'Car km Travelled (bn)',        color: '#64748b', values: [38,  36,  34,  32,  31, 30,  22,  26]  },
          ],
        },
      },
      {
        title: 'Social Media Users vs Newspaper Circulation – USA (2005–2022)',
        instruction: 'The line graph below shows the total number of social media users (in millions) and the total daily newspaper circulation (in millions of copies) in the United States from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions',
          xValues: ['2005','2008','2010','2012','2015','2017','2019','2022'],
          series: [
            { name: 'Social Media Users (m)',       color: '#3b82f6', values: [16,  92, 174, 244, 212, 248, 262, 302] },
            { name: 'Newspaper Circulation (m)',    color: '#64748b', values: [48,  42,  36,  30,  24,  20,  16,  12] },
          ],
        },
      },
      {
        title: 'Coal vs Wind Electricity Production – Germany (2010–2022)',
        instruction: 'The line graph below shows the annual electricity generation from coal and from wind power in Germany (in terawatt-hours) from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Terawatt-hours (TWh)',
          xValues: ['2010','2012','2014','2016','2018','2020','2021','2022'],
          series: [
            { name: 'Coal',  color: '#64748b', values: [284, 296, 278, 262, 228, 148, 162, 128] },
            { name: 'Wind',  color: '#22c55e', values: [37,  46,  56,  78, 111, 132, 114, 134] },
          ],
        },
      },
      {
        title: 'Male vs Female Unemployment Rate – Spain (2010–2022)',
        instruction: 'The line graph below shows the unemployment rate for males and females in Spain from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of labour force',
          xValues: ['2010','2012','2014','2016','2018','2019','2020','2022'],
          series: [
            { name: 'Male',   color: '#3b82f6', values: [19.2, 24.6, 23.8, 19.4, 14.8, 13.4, 16.8, 12.6] },
            { name: 'Female', color: '#ec4899', values: [20.4, 25.8, 26.2, 22.6, 17.2, 15.8, 19.4, 14.8] },
          ],
        },
      },
      {
        title: 'Housing Starts vs Homelessness Applications – England (2010–2022)',
        instruction: 'The line graph below shows the annual number of new housing units started (in thousands) and the number of homelessness applications to local authorities (in thousands) in England from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Thousands',
          xValues: ['2010','2013','2015','2017','2019','2020','2022'],
          series: [
            { name: 'Housing Starts (000s)',          color: '#22c55e', values: [76, 98, 128, 162, 172, 148, 186] },
            { name: 'Homelessness Applications (000s)',color: '#ef4444', values: [52, 56,  62,  78,  84,  96, 114] },
          ],
        },
      },
      {
        title: 'Graduate Salaries vs Student Loan Debt – UK (2010–2022)',
        instruction: 'The line graph below shows the average starting salary for UK graduates and the average student loan debt at graduation (both in thousands of pounds) from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '£ thousands',
          xValues: ['2010','2012','2014','2016','2018','2020','2022'],
          series: [
            { name: 'Avg Starting Salary (£k)', color: '#22c55e', values: [21.2, 22.4, 23.8, 25.6, 27.4, 28.2, 30.8] },
            { name: 'Avg Student Debt (£k)',    color: '#ef4444', values: [14.2, 20.6, 24.8, 32.2, 38.8, 42.4, 45.6] },
          ],
        },
      },
      {
        title: 'Exports vs Imports – South Korea ($bn) (2000–2022)',
        instruction: 'The line graph below shows the total value of goods exported and imported by South Korea (in billions of USD) from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'USD billions',
          xValues: ['2000','2005','2010','2015','2018','2020','2022'],
          series: [
            { name: 'Exports', color: '#3b82f6', values: [172, 284, 466, 527, 605, 512, 683] },
            { name: 'Imports', color: '#ef4444', values: [160, 261, 425, 436, 535, 467, 732] },
          ],
        },
      },
      {
        title: 'Smoking Prevalence vs Lung Cancer Mortality – UK (1975–2020)',
        instruction: 'The line graph below shows the percentage of adults who smoke and the lung cancer mortality rate per 100,000 people in the UK from 1975 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Smoking (%); Cancer rate (/100k)',
          xValues: ['1975','1985','1995','2000','2005','2010','2015','2020'],
          series: [
            { name: 'Smoking Prevalence (%)',       color: '#64748b', values: [46, 36, 28, 27, 24, 20, 17, 14] },
            { name: 'Lung Cancer Mortality/100k', color: '#ef4444', values: [74, 78, 72, 66, 58, 50, 44, 38] },
          ],
        },
      },
      {
        title: 'EV Sales vs Public Charging Stations – USA (2015–2022)',
        instruction: 'The line graph below shows the cumulative number of battery electric vehicles sold (in millions) and the number of publicly accessible EV charging stations (in thousands) in the United States from 2015 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'EVs (millions) / Chargers (thousands)',
          xValues: ['2015','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Cumulative EV Sales (m)',  color: '#22c55e', values: [0.38, 0.56, 0.76, 1.07, 1.45, 1.80, 2.50, 3.22] },
            { name: 'Charging Stations (000s)', color: '#3b82f6', values: [8.4, 14.8, 25.4, 44.4, 58.6, 74.4, 96.2, 130.0] },
          ],
        },
      },
      {
        title: 'Forest Cover vs Soya Production – Brazil (1990–2022)',
        instruction: 'The line graph below shows the total Amazon forest cover (in millions of hectares) and the annual soya bean production (in millions of tonnes) in Brazil from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Forest (m ha) / Soya (m tonnes)',
          xValues: ['1990','1995','2000','2005','2010','2015','2019','2022'],
          series: [
            { name: 'Amazon Forest Cover (m ha)', color: '#22c55e', values: [4.02, 3.92, 3.76, 3.58, 3.42, 3.37, 3.30, 3.25] },
            { name: 'Soya Production (m tonnes)', color: '#f97316', values: [15.8, 25.7, 32.9, 51.2, 68.7, 96.2, 114.9, 125.8] },
          ],
        },
      },
      {
        title: 'Primary, Secondary and Tertiary Sector Employment – UK (1980–2022)',
        instruction: 'The line graph below shows the percentage of the UK workforce employed in the primary (agriculture, mining), secondary (manufacturing, construction) and tertiary (services) sectors from 1980 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of total workforce',
          xValues: ['1980','1985','1990','1995','2000','2005','2010','2015','2022'],
          series: [
            { name: 'Primary',    color: '#22c55e', values: [3.2, 2.8, 2.4, 2.1, 1.8, 1.6, 1.4, 1.2, 1.1] },
            { name: 'Secondary',  color: '#64748b', values: [36, 30, 26, 22, 19, 17, 15, 14, 16]  },
            { name: 'Tertiary',   color: '#3b82f6', values: [61, 67, 72, 76, 79, 81, 84, 85, 83]  },
          ],
        },
      },
      {
        title: 'GDP Growth: USA, EU and China (%) (2000–2022)',
        instruction: 'The line graph below shows the annual GDP growth rate (%) for the United States, the European Union and China from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% annual GDP growth',
          xValues: ['2000','2005','2008','2010','2013','2016','2019','2020','2022'],
          series: [
            { name: 'USA',  color: '#3b82f6', values: [4.1, 3.5, -0.1, 2.7, 1.8, 1.7, 2.3, -3.4, 2.1] },
            { name: 'EU',   color: '#22c55e', values: [3.8, 2.2, -0.4, 2.1, 0.2, 2.0, 1.6, -6.2, 3.4] },
            { name: 'China',color: '#ef4444', values: [8.5, 11.4, 9.7, 10.6, 7.8, 6.8, 6.1,  2.2, 3.0] },
          ],
        },
      },
      {
        title: 'Life Expectancy: High, Middle and Low Income Countries (1990–2022)',
        instruction: 'The line graph below shows the average life expectancy at birth for high-, middle- and low-income countries from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Years',
          xValues: ['1990','1995','2000','2005','2010','2015','2019','2022'],
          series: [
            { name: 'High Income',   color: '#3b82f6', values: [76.2, 77.4, 78.2, 79.0, 80.0, 80.8, 81.2, 81.0] },
            { name: 'Middle Income', color: '#22c55e', values: [64.8, 66.4, 68.2, 70.0, 71.8, 73.0, 73.6, 72.0] },
            { name: 'Low Income',    color: '#ef4444', values: [49.2, 48.6, 52.0, 56.4, 60.8, 63.4, 64.6, 63.8] },
          ],
        },
      },
      {
        title: 'Electricity from Solar, Wind and Hydro – Germany (2005–2022)',
        instruction: 'The line graph below shows the amount of electricity generated from solar photovoltaic, wind and hydropower sources in Germany (in terawatt-hours) from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Terawatt-hours (TWh)',
          xValues: ['2005','2008','2010','2012','2014','2016','2018','2020','2022'],
          series: [
            { name: 'Solar PV', color: '#eab308', values: [1.3, 4.4, 11.7, 26.4, 36.1, 38.1, 45.7, 50.7, 59.8] },
            { name: 'Wind',     color: '#22c55e', values: [27.2, 40.6, 37.8, 50.7, 57.4, 78.6, 111.5, 131.8, 134.4] },
            { name: 'Hydro',    color: '#06b6d4', values: [19.8, 20.4, 21.0, 21.8, 19.9, 20.1, 17.5, 18.6, 17.8] },
          ],
        },
      },
      {
        title: 'World Population Growth: Africa, Asia and Europe (billions) (1950–2050)',
        instruction: 'The line graph below shows the actual and projected population (in billions) of Africa, Asia and Europe from 1950 to 2050. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Billions of people',
          xValues: ['1950','1970','1990','2010','2020','2030','2050'],
          series: [
            { name: 'Africa', color: '#f97316', values: [0.23, 0.36, 0.63, 1.04, 1.34, 1.70, 2.49] },
            { name: 'Asia',   color: '#3b82f6', values: [1.40, 2.14, 3.20, 4.16, 4.64, 4.92, 5.29] },
            { name: 'Europe', color: '#22c55e', values: [0.55, 0.66, 0.72, 0.74, 0.75, 0.74, 0.71] },
          ],
        },
      },
      {
        title: 'Unemployment: Youth, Adults and Older Workers – UK (2005–2022)',
        instruction: 'The line graph below shows the unemployment rate for young people (16–24), adults (25–49) and older workers (50–64) in the UK from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of each age group in labour force',
          xValues: ['2005','2008','2010','2012','2014','2016','2019','2020','2022'],
          series: [
            { name: 'Youth (16–24)',       color: '#ef4444', values: [11.8, 14.2, 19.4, 21.2, 17.0, 13.6, 11.4, 14.8, 11.0] },
            { name: 'Adults (25–49)',      color: '#3b82f6', values: [3.8,  4.2,  5.6,  6.0,  5.0,  4.2,  3.4,  4.8,  3.2]  },
            { name: 'Older (50–64)',       color: '#22c55e', values: [2.8,  3.2,  4.4,  4.8,  3.8,  3.4,  2.8,  4.0,  2.6]  },
          ],
        },
      },
      {
        title: 'Food Prices: Cereals, Vegetables and Meat Index (2000–2022)',
        instruction: 'The line graph below shows the global price index for cereals, vegetables and meat (2014–2016 = 100) from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Price Index (2014–2016 = 100)',
          xValues: ['2000','2005','2008','2011','2014','2016','2019','2021','2022'],
          series: [
            { name: 'Cereals',    color: '#eab308', values: [50, 64, 106, 128, 102, 98, 102, 148, 168] },
            { name: 'Vegetables', color: '#22c55e', values: [68, 78, 98,  112, 104, 96, 112, 118, 132] },
            { name: 'Meat',       color: '#ef4444', values: [62, 74, 98,  110, 102, 98, 106, 114, 126] },
          ],
        },
      },
      {
        title: 'Social Media Daily Use: Gen Z, Millennials and Gen X – UK (2015–2022)',
        instruction: 'The line graph below shows the average daily time (in minutes) spent on social media by members of Generation Z (born 1997–2012), Millennials (born 1981–1996) and Generation X (born 1965–1980) in the UK from 2015 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Minutes per day',
          xValues: ['2015','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Gen Z (born 1997–2012)',       color: '#3b82f6', values: [92, 114, 132, 158, 172, 214, 228, 238] },
            { name: 'Millennials (born 1981–1996)', color: '#22c55e', values: [68, 82,  94, 108, 116, 142, 152, 158] },
            { name: 'Gen X (born 1965–1980)',       color: '#f97316', values: [34, 44,  52,  62,  68,  88,  94,  98] },
          ],
        },
      },
      {
        title: 'Freshwater Use: Agriculture, Industry and Domestic – World (1975–2020)',
        instruction: 'The line graph below shows the global freshwater withdrawals (in km³ per year) by the agricultural, industrial and domestic sectors from 1975 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'km³ per year',
          xValues: ['1975','1985','1995','2000','2005','2010','2015','2020'],
          series: [
            { name: 'Agriculture', color: '#22c55e', values: [2148, 2484, 2604, 2708, 2792, 2812, 2864, 2872] },
            { name: 'Industry',    color: '#64748b', values: [494,  614,  682,  726,  744,  748,  734,  722]  },
            { name: 'Domestic',    color: '#3b82f6', values: [218,  268,  328,  368,  408,  462,  494,  512]  },
          ],
        },
      },
      {
        title: 'Car Sales: Electric, Hybrid and Fossil Fuel – Global (2012–2022)',
        instruction: 'The line graph below shows the global annual sales of battery electric vehicles, hybrid vehicles and fossil-fuel-only vehicles (all in millions) from 2012 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions of cars sold',
          xValues: ['2012','2014','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Fossil Fuel (ICE)', color: '#64748b', values: [80.8, 84.2, 90.6, 92.4, 90.2, 86.4, 74.8, 78.2, 74.6] },
            { name: 'Hybrid',            color: '#f59e0b', values: [2.8,  4.2,  6.4,  8.6, 10.8, 12.4,  9.6, 12.8, 14.2] },
            { name: 'Electric (BEV)',    color: '#22c55e', values: [0.09, 0.32, 0.76, 1.02, 1.98, 2.21,  3.24, 6.58, 10.52] },
          ],
        },
      },
      {
        title: 'Refugee Origins: Middle East, Africa and Central Asia (millions) (2005–2022)',
        instruction: 'The line graph below shows the number of UNHCR-registered refugees originating from the Middle East, Africa and Central Asia (in millions) from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions of refugees',
          xValues: ['2005','2010','2013','2015','2017','2019','2021','2022'],
          series: [
            { name: 'Middle East',   color: '#ef4444', values: [1.4, 1.8, 4.2, 6.8, 8.4, 8.6, 9.2, 10.8] },
            { name: 'Africa',        color: '#f97316', values: [2.8, 3.2, 3.8, 4.4, 5.6, 6.8, 8.4, 10.2] },
            { name: 'Central Asia',  color: '#8b5cf6', values: [2.2, 2.4, 2.6, 2.8, 3.2, 3.4, 3.8,  4.2] },
          ],
        },
      },
      {
        title: 'Earnings Growth: Top 10%, Middle 40% and Bottom 50% – UK (2000–2022)',
        instruction: 'The line graph below shows the cumulative real earnings growth (%) for the top 10%, middle 40% and bottom 50% of earners in the UK from 2000 to 2022 (base year 2000 = 0%). Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Cumulative real earnings growth (%, base 2000)',
          xValues: ['2000','2005','2008','2010','2013','2016','2019','2022'],
          series: [
            { name: 'Top 10%',    color: '#3b82f6', values: [0, 12.4, 18.8, 16.2, 14.8, 22.4, 28.6, 36.2] },
            { name: 'Middle 40%', color: '#22c55e', values: [0, 8.2,  10.4,  7.6,  5.2, 8.4,  11.8, 14.2] },
            { name: 'Bottom 50%', color: '#ef4444', values: [0, 4.8,   5.2,  1.8, -2.4,  1.2,   4.6,  6.8] },
          ],
        },
      },
      {
        title: 'Health Outcomes: Hospital Admissions, GP Visits and A&E Attendances – England (2010–2022)',
        instruction: 'The line graph below shows the total annual hospital admissions, GP appointment numbers and accident & emergency attendances in England (all in millions) from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Millions',
          xValues: ['2010','2013','2015','2017','2019','2020','2021','2022'],
          series: [
            { name: 'GP Visits (m)',              color: '#22c55e', values: [338, 356, 372, 388, 406, 286, 322, 364] },
            { name: 'Hospital Admissions (m)',     color: '#3b82f6', values: [14.6, 15.4, 16.2, 17.0, 17.8, 12.8, 14.4, 16.2] },
            { name: 'A&E Attendances (m)',         color: '#ef4444', values: [18.6, 20.4, 22.2, 23.8, 25.6, 18.6, 22.8, 25.4] },
          ],
        },
      },
      {
        title: 'PISA Scores – UK: Reading, Mathematics and Science (2000–2022)',
        instruction: 'The line graph below shows the UK\'s average PISA scores in reading, mathematics and science from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'PISA average score',
          xValues: ['2000','2003','2006','2009','2012','2015','2018','2022'],
          series: [
            { name: 'Reading',     color: '#3b82f6', values: [523, 507, 495, 494, 499, 498, 504, 494] },
            { name: 'Mathematics', color: '#f97316', values: [529, 508, 495, 492, 494, 492, 502, 489] },
            { name: 'Science',     color: '#22c55e', values: [532, 516, 515, 514, 514, 509, 505, 508] },
          ],
        },
      },
      {
        title: 'Employment by Sector: Services, Industry and Agriculture – India (1990–2022)',
        instruction: 'The line graph below shows the percentage of the Indian workforce employed in the services, industry and agriculture sectors from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of workforce',
          xValues: ['1990','1995','2000','2005','2010','2015','2019','2022'],
          series: [
            { name: 'Services',    color: '#3b82f6', values: [22, 24, 26, 28, 31, 33, 35, 32] },
            { name: 'Industry',    color: '#f97316', values: [16, 18, 19, 22, 24, 25, 26, 28] },
            { name: 'Agriculture', color: '#22c55e', values: [62, 58, 55, 50, 45, 42, 39, 40] },
          ],
        },
      },
      {
        title: 'CO₂ Emissions per Capita: USA, UK, China and India (1990–2022)',
        instruction: 'The line graph below shows the CO₂ emissions per capita (in tonnes) for the USA, UK, China and India from 1990 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Tonnes of CO₂ per person',
          xValues: ['1990','1995','2000','2005','2010','2015','2019','2022'],
          series: [
            { name: 'USA',   color: '#ef4444', values: [19.4, 19.8, 20.6, 19.8, 17.2, 16.2, 15.4, 14.2] },
            { name: 'UK',    color: '#3b82f6', values: [10.2,  9.6,  9.1,  8.8,  7.8,  6.4,  5.6,  4.8]  },
            { name: 'China', color: '#f97316', values: [2.1,  2.6,  2.7,  4.2,  6.2,  7.2,  7.8,  8.1]  },
            { name: 'India', color: '#22c55e', values: [0.6,  0.7,  0.9,  1.1,  1.4,  1.7,  1.8,  1.9]  },
          ],
        },
      },
      {
        title: 'Average Internet Speed (Mbps): USA, South Korea, India and UK (2010–2022)',
        instruction: 'The line graph below shows the average broadband download speed in megabits per second for the USA, South Korea, India and the UK from 2010 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Mbps',
          xValues: ['2010','2013','2015','2017','2018','2019','2020','2022'],
          series: [
            { name: 'S. Korea', color: '#ef4444', values: [32, 52, 76, 102, 136, 168, 198, 248] },
            { name: 'USA',      color: '#3b82f6', values: [14, 24, 40,  62,  84, 112, 154, 218] },
            { name: 'UK',       color: '#22c55e', values: [8,  16, 26,  46,  68,  92, 128, 186] },
            { name: 'India',    color: '#f97316', values: [0.9, 2, 6,  14,  24,  36,  50,  72] },
          ],
        },
      },
      {
        title: 'GDP Growth: BRIC Countries (%) (2000–2022)',
        instruction: 'The line graph below shows the annual GDP growth rate (%) for Brazil, Russia, India and China from 2000 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% annual GDP growth',
          xValues: ['2000','2005','2008','2010','2013','2016','2019','2020','2022'],
          series: [
            { name: 'Brazil', color: '#22c55e', values: [4.4, 3.2, 5.1, 7.5, 3.0, -3.3, 1.1, -4.1, 2.9] },
            { name: 'Russia', color: '#ef4444', values: [10.0, 6.4, 5.2, 4.5, 1.8, -0.2, 2.0, -2.7, -2.1] },
            { name: 'India',  color: '#f97316', values: [3.8, 9.3, 3.9, 8.4, 6.4,  8.3, 4.2, -6.6, 7.2] },
            { name: 'China',  color: '#3b82f6', values: [8.5, 11.4, 9.7, 10.6, 7.8, 6.8, 6.1, 2.2,  3.0] },
          ],
        },
      },
      {
        title: 'Life Expectancy: Sweden, Japan, Nigeria and Bangladesh (1970–2022)',
        instruction: 'The line graph below shows the life expectancy at birth (in years) for Sweden, Japan, Nigeria and Bangladesh from 1970 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Years',
          xValues: ['1970','1980','1990','2000','2005','2010','2015','2022'],
          series: [
            { name: 'Sweden',     color: '#3b82f6', values: [74.8, 76.0, 77.8, 79.6, 80.6, 81.6, 82.2, 83.0] },
            { name: 'Japan',      color: '#ef4444', values: [72.0, 76.1, 78.9, 81.2, 82.1, 83.0, 83.8, 84.3] },
            { name: 'Bangladesh', color: '#22c55e', values: [45.2, 52.0, 59.4, 66.2, 69.4, 71.4, 72.4, 73.8] },
            { name: 'Nigeria',    color: '#f97316', values: [41.2, 44.8, 45.6, 46.8, 49.2, 52.0, 54.6, 56.9] },
          ],
        },
      },
      {
        title: 'Renewable Energy Share: Germany, Denmark, France and Poland (%) (2005–2022)',
        instruction: 'The line graph below shows the percentage of total electricity generation from renewable sources in Germany, Denmark, France and Poland from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of total electricity generation',
          xValues: ['2005','2008','2010','2012','2014','2016','2018','2020','2022'],
          series: [
            { name: 'Denmark',  color: '#22c55e', values: [29, 38, 40, 50, 59, 67, 72, 82, 88] },
            { name: 'Germany',  color: '#3b82f6', values: [10, 15, 17, 23, 28, 32, 38, 46, 49] },
            { name: 'France',   color: '#ef4444', values: [11, 14, 17, 19, 19, 20, 22, 26, 26] },
            { name: 'Poland',   color: '#64748b', values: [3,  5,  7,  10, 12, 14, 16, 17, 18] },
          ],
        },
      },
      {
        title: 'Media Consumption: Streaming, Cinema, TV Broadcast and Radio – UK (2008–2022)',
        instruction: 'The line graph below shows the average weekly hours spent on streaming video, going to the cinema, watching TV broadcast and listening to radio by adults in the UK from 2008 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Average hours per week per adult',
          xValues: ['2008','2011','2014','2016','2017','2018','2019','2020','2022'],
          series: [
            { name: 'TV Broadcast',    color: '#64748b', values: [24.8, 26.4, 24.6, 22.4, 21.2, 20.0, 18.8, 22.4, 16.4] },
            { name: 'Radio',           color: '#22c55e', values: [18.4, 18.8, 19.2, 18.6, 18.4, 18.0, 17.6, 17.2, 16.8] },
            { name: 'Streaming Video', color: '#3b82f6', values: [0.2,  0.8,  2.4,  4.8,  6.2,  8.4, 10.6, 16.4, 18.8] },
            { name: 'Cinema',          color: '#f97316', values: [0.4,  0.5,  0.6,  0.6,  0.6,  0.7,  0.7,  0.2,  0.5] },
          ],
        },
      },
      {
        title: 'Smartphone Users: Americas, Europe, Asia and Africa (billions) (2012–2022)',
        instruction: 'The line graph below shows the number of smartphone users (in billions) in the Americas, Europe, Asia-Pacific and Africa from 2012 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Billions of users',
          xValues: ['2012','2014','2016','2017','2018','2019','2020','2021','2022'],
          series: [
            { name: 'Asia-Pacific', color: '#3b82f6', values: [0.80, 1.42, 2.08, 2.42, 2.74, 2.98, 3.18, 3.42, 3.68] },
            { name: 'Americas',     color: '#22c55e', values: [0.32, 0.48, 0.62, 0.72, 0.80, 0.88, 0.94, 1.00, 1.06] },
            { name: 'Europe',       color: '#f97316', values: [0.28, 0.38, 0.48, 0.54, 0.58, 0.62, 0.66, 0.70, 0.74] },
            { name: 'Africa',       color: '#ef4444', values: [0.04, 0.10, 0.20, 0.28, 0.36, 0.44, 0.52, 0.64, 0.78] },
          ],
        },
      },
      {
        title: 'Temperature Anomaly: Arctic, Antarctic, Tropics and Global Average (1980–2022)',
        instruction: 'The line graph below shows the temperature anomaly (°C above the 1981–2010 average) for the Arctic, Antarctic, Tropical belt and the global average from 1980 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '°C above 1981–2010 average',
          xValues: ['1980','1990','2000','2005','2010','2015','2018','2020','2022'],
          series: [
            { name: 'Arctic',         color: '#06b6d4', values: [0.2, 0.8, 1.4, 2.0, 2.6, 3.2, 3.8, 4.2, 4.8] },
            { name: 'Global Average', color: '#ef4444', values: [0.1, 0.4, 0.6, 0.7, 0.7, 0.9, 1.0, 1.0, 1.2] },
            { name: 'Tropics',        color: '#f97316', values: [0.1, 0.3, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] },
            { name: 'Antarctic',      color: '#8b5cf6', values: [0.0, 0.1, 0.2, 0.2, 0.3, 0.4, 0.4, 0.5, 0.8] },
          ],
        },
      },
      {
        title: 'School Enrollment: Pre-Primary, Primary, Secondary and Tertiary – World (1980–2020)',
        instruction: 'The line graph below shows the gross school enrollment ratio (% of relevant age group) for pre-primary, primary, secondary and tertiary education worldwide from 1980 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: 'Gross enrollment ratio (% of relevant age group)',
          xValues: ['1980','1990','2000','2005','2010','2015','2018','2020'],
          series: [
            { name: 'Primary',     color: '#22c55e', values: [96,  98, 100, 104, 106, 104, 102, 102] },
            { name: 'Secondary',   color: '#3b82f6', values: [46,  52, 62,  66,  72,  76,  78,  80]  },
            { name: 'Tertiary',    color: '#8b5cf6', values: [12,  14, 19,  24,  28,  36,  38,  40]  },
            { name: 'Pre-Primary', color: '#f97316', values: [22,  28, 38,  46,  52,  56,  58,  62]  },
          ],
        },
      },
      {
        title: 'Obesity, Diabetes, Heart Disease and Mental Health Rates – UK (2005–2022)',
        instruction: 'The line graph below shows the prevalence rates (% of adult population) of obesity, diabetes, heart disease and mental health disorders in the UK from 2005 to 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'line',
          unit: '% of adult population',
          xValues: ['2005','2008','2011','2014','2017','2019','2021','2022'],
          series: [
            { name: 'Obesity',           color: '#ef4444', values: [22.4, 24.2, 25.8, 26.4, 27.2, 28.0, 28.6, 28.0] },
            { name: 'Mental Health',     color: '#8b5cf6', values: [15.4, 16.2, 17.2, 18.4, 19.4, 20.2, 22.8, 20.1] },
            { name: 'Diabetes',          color: '#f97316', values: [4.2,  4.6,  5.4,  6.2,  6.8,  7.2,  7.8,  7.4]  },
            { name: 'Heart Disease',     color: '#3b82f6', values: [8.4,  8.2,  8.0,  7.8,  7.6,  7.4,  7.2,  7.0]  },
          ],
        },
      },
    ],
  },

  /* ═══════════════════ PIE CHART ═══════════════════ */
  {
    type: 'pie',
    label: 'Pie Chart',
    description: 'Discuss proportions and percentage distributions.',
    color: 'amber',
    prompts: [
      // ── Single pie (3–4 segments) ──
      {
        title: 'Smartphone Brand Market Share – Global (2023)',
        instruction: 'The pie chart below shows the global market share of smartphone brands in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Market Share (%) – 2023',
              segments: [
                { name: 'Apple',   value: 30, color: '#3b82f6' },
                { name: 'Samsung', value: 28, color: '#22c55e' },
                { name: 'Xiaomi',  value: 22, color: '#f97316' },
                { name: 'Others',  value: 20, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Sources of Household Income – UK (2022)',
        instruction: 'The pie chart below shows the main sources of income for households in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Household Income Sources – UK (2022)',
              segments: [
                { name: 'Employment',  value: 68, color: '#3b82f6' },
                { name: 'Benefits',    value: 12, color: '#ef4444' },
                { name: 'Investments', value: 11, color: '#22c55e' },
                { name: 'Other',       value: 9,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Reasons for Studying English – Global Survey (2023)',
        instruction: 'The pie chart below shows the main reasons why people around the world study English, based on a survey conducted in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Reasons for Studying English (2023)',
              segments: [
                { name: 'Career',    value: 42, color: '#3b82f6' },
                { name: 'Travel',    value: 28, color: '#f97316' },
                { name: 'Education', value: 20, color: '#22c55e' },
                { name: 'Other',     value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Household Water Usage – Australia (2021)',
        instruction: 'The pie chart below shows how households in Australia used water in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Water Usage by Category – Australia (2021)',
              segments: [
                { name: 'Bathroom/Shower', value: 35, color: '#06b6d4' },
                { name: 'Garden',          value: 28, color: '#22c55e' },
                { name: 'Kitchen',         value: 22, color: '#f97316' },
                { name: 'Other',           value: 15, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'International Tourist Arrivals by Region – World (2022)',
        instruction: 'The pie chart below shows the share of international tourist arrivals by world region in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Tourist Arrivals by Region (2022)',
              segments: [
                { name: 'Europe',       value: 44, color: '#3b82f6' },
                { name: 'Asia-Pacific', value: 27, color: '#22c55e' },
                { name: 'Americas',     value: 18, color: '#f97316' },
                { name: 'Other',        value: 11, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Road Accidents – UK (2021)',
        instruction: 'The pie chart below shows the main causes of road accidents in the United Kingdom in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Road Accident Causes – UK (2021)',
              segments: [
                { name: 'Driver Error',      value: 72, color: '#ef4444' },
                { name: 'Vehicle Defect',    value: 16, color: '#f97316' },
                { name: 'Road Conditions',   value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Internet Traffic by Type – Global (2023)',
        instruction: 'The pie chart below shows the composition of global internet traffic by type in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Internet Traffic by Type (2023)',
              segments: [
                { name: 'Video Streaming', value: 65, color: '#3b82f6' },
                { name: 'Social Media',    value: 23, color: '#ec4899' },
                { name: 'Other',           value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Deforestation by Cause (2020)',
        instruction: 'The pie chart below shows the main causes of global deforestation in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Global Deforestation Causes (2020)',
              segments: [
                { name: 'Agriculture',    value: 73, color: '#22c55e' },
                { name: 'Logging',        value: 14, color: '#f97316' },
                { name: 'Infrastructure', value: 8,  color: '#94a3b8' },
                { name: 'Other',          value: 5,  color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Energy Use in UK Homes (2022)',
        instruction: 'The pie chart below shows how energy was used in homes across the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Home Energy Use – UK (2022)',
              segments: [
                { name: 'Space Heating', value: 57, color: '#ef4444' },
                { name: 'Hot Water',     value: 23, color: '#f97316' },
                { name: 'Appliances',    value: 14, color: '#3b82f6' },
                { name: 'Lighting',      value: 6,  color: '#eab308' },
              ],
            },
          ],
        },
      },
      {
        title: 'Household Expenditure – Germany (2021)',
        instruction: 'The pie chart below shows the main categories of household expenditure in Germany in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Household Expenditure – Germany (2021)',
              segments: [
                { name: 'Housing',    value: 32, color: '#ef4444' },
                { name: 'Food',       value: 28, color: '#22c55e' },
                { name: 'Transport',  value: 20, color: '#3b82f6' },
                { name: 'Other',      value: 20, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'CO₂ Emissions by Sector – Australia (2022)',
        instruction: 'The pie chart below shows the proportion of CO₂ emissions produced by different sectors in Australia in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'CO₂ Emissions by Sector – Australia (2022)',
              segments: [
                { name: 'Energy',      value: 34, color: '#ef4444' },
                { name: 'Transport',   value: 22, color: '#f97316' },
                { name: 'Agriculture', value: 19, color: '#22c55e' },
                { name: 'Other',       value: 25, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Cancer Research Funding by Source – USA (2022)',
        instruction: 'The pie chart below shows the sources of cancer research funding in the United States in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Cancer Research Funding – USA (2022)',
              segments: [
                { name: 'Government', value: 52, color: '#3b82f6' },
                { name: 'Charities',  value: 31, color: '#22c55e' },
                { name: 'Private',    value: 17, color: '#f97316' },
              ],
            },
          ],
        },
      },
      {
        title: 'Olympic Medals by Continent – Tokyo 2020',
        instruction: 'The pie chart below shows the distribution of Olympic medals by continent at the Tokyo 2020 Olympic Games. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Olympic Medals by Continent – Tokyo 2020',
              segments: [
                { name: 'Europe',   value: 38, color: '#3b82f6' },
                { name: 'Americas', value: 30, color: '#22c55e' },
                { name: 'Asia',     value: 25, color: '#f97316' },
                { name: 'Other',    value: 7,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Smartphone Usage Time by Activity – UK Teenagers (2023)',
        instruction: 'The pie chart below shows how teenagers in the UK spent their daily smartphone screen time in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Smartphone Usage – UK Teens (2023)',
              segments: [
                { name: 'Social Media', value: 40, color: '#ec4899' },
                { name: 'Gaming',       value: 28, color: '#8b5cf6' },
                { name: 'Video',        value: 22, color: '#3b82f6' },
                { name: 'Other',        value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Plastic Waste by Product Type – Global (2022)',
        instruction: 'The pie chart below shows the breakdown of global plastic waste by product type in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Plastic Waste by Product Type (2022)',
              segments: [
                { name: 'Packaging',      value: 46, color: '#ef4444' },
                { name: 'Textiles',       value: 16, color: '#8b5cf6' },
                { name: 'Consumer Goods', value: 14, color: '#f97316' },
                { name: 'Other',          value: 24, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'University Subjects – UK Undergraduates (2022)',
        instruction: 'The pie chart below shows the distribution of UK undergraduate students across subject areas in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'UK Undergraduates by Subject (2022)',
              segments: [
                { name: 'Business',       value: 24, color: '#3b82f6' },
                { name: 'STEM',           value: 34, color: '#22c55e' },
                { name: 'Arts/Humanities',value: 26, color: '#f97316' },
                { name: 'Other',          value: 16, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Food Waste – UK (2021)',
        instruction: 'The pie chart below shows the main sources of food waste in the United Kingdom in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Food Waste by Source – UK (2021)',
              segments: [
                { name: 'Households',   value: 70, color: '#22c55e' },
                { name: 'Retail',       value: 18, color: '#f97316' },
                { name: 'Food Service', value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Water Use by Sector (2022)',
        instruction: 'The pie chart below shows how freshwater resources were used across different sectors globally in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Global Freshwater Use by Sector (2022)',
              segments: [
                { name: 'Agriculture', value: 72, color: '#22c55e' },
                { name: 'Industry',    value: 16, color: '#f97316' },
                { name: 'Domestic',    value: 12, color: '#06b6d4' },
              ],
            },
          ],
        },
      },
      {
        title: 'Income Sources – UK Charity Organisation (2022)',
        instruction: 'The pie chart below shows the proportion of income received from different sources by a typical large charity in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Charity Income Sources – UK (2022)',
              segments: [
                { name: 'Donations',         value: 48, color: '#ec4899' },
                { name: 'Government Grants', value: 28, color: '#3b82f6' },
                { name: 'Events',            value: 14, color: '#f97316' },
                { name: 'Other',             value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Daily Commute Transport Mode – London (2023)',
        instruction: 'The pie chart below shows how workers in London travelled to work on a typical weekday in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'London Commute Transport Mode (2023)',
              segments: [
                { name: 'Underground/Rail', value: 38, color: '#3b82f6' },
                { name: 'Bus',             value: 28, color: '#22c55e' },
                { name: 'Car',             value: 22, color: '#f97316' },
                { name: 'Other',           value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Crime Reported – Australia (2021)',
        instruction: 'The pie chart below shows the proportion of different types of crime reported to police in Australia in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Crime Types – Australia (2021)',
              segments: [
                { name: 'Property',     value: 54, color: '#f97316' },
                { name: 'Violence',     value: 22, color: '#ef4444' },
                { name: 'Drug-Related', value: 16, color: '#8b5cf6' },
                { name: 'Other',        value: 8,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Land Use Distribution (2022)',
        instruction: 'The pie chart below shows how the world\'s land surface was used in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Global Land Use (2022)',
              segments: [
                { name: 'Agriculture', value: 51, color: '#22c55e' },
                { name: 'Forest',      value: 31, color: '#84cc16' },
                { name: 'Urban',       value: 4,  color: '#94a3b8' },
                { name: 'Other',       value: 14, color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'UK Electricity Generation by Source (2023)',
        instruction: 'The pie chart below shows the breakdown of electricity generation in the United Kingdom by energy source in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'UK Electricity Generation (2023)',
              segments: [
                { name: 'Wind',    value: 30, color: '#22c55e' },
                { name: 'Gas',     value: 32, color: '#f97316' },
                { name: 'Nuclear', value: 15, color: '#8b5cf6' },
                { name: 'Other',   value: 23, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Budget Allocation – UK Local Council (2022)',
        instruction: 'The pie chart below shows how a typical UK local council allocated its annual budget in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Local Council Budget – UK (2022)',
              segments: [
                { name: 'Social Services', value: 35, color: '#ef4444' },
                { name: 'Education',       value: 28, color: '#3b82f6' },
                { name: 'Transport',       value: 20, color: '#f97316' },
                { name: 'Other',           value: 17, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'TV Viewing by Genre – UK (2023)',
        instruction: 'The pie chart below shows the proportion of television viewing time spent on different genres by UK audiences in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'TV Viewing by Genre – UK (2023)',
              segments: [
                { name: 'Drama/Soaps', value: 32, color: '#ec4899' },
                { name: 'News',        value: 26, color: '#3b82f6' },
                { name: 'Sport',       value: 24, color: '#22c55e' },
                { name: 'Other',       value: 18, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Employment by Sector – Singapore (2022)',
        instruction: 'The pie chart below shows the distribution of employment across economic sectors in Singapore in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Employment by Sector – Singapore (2022)',
              segments: [
                { name: 'Services',      value: 74, color: '#3b82f6' },
                { name: 'Manufacturing', value: 15, color: '#f97316' },
                { name: 'Construction',  value: 7,  color: '#94a3b8' },
                { name: 'Other',         value: 4,  color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Renewable Energy by Type – Germany (2022)',
        instruction: 'The pie chart below shows the share of different renewable energy types in Germany\'s total renewable electricity generation in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Renewable Energy Mix – Germany (2022)',
              segments: [
                { name: 'Wind',    value: 43, color: '#06b6d4' },
                { name: 'Solar',   value: 29, color: '#eab308' },
                { name: 'Biomass', value: 20, color: '#22c55e' },
                { name: 'Other',   value: 8,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Child Malnutrition – Global (2022)',
        instruction: 'The pie chart below shows the main causes of child malnutrition worldwide in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Causes of Child Malnutrition (2022)',
              segments: [
                { name: 'Poverty',              value: 58, color: '#ef4444' },
                { name: 'Poor Sanitation',      value: 25, color: '#f97316' },
                { name: 'Lack of Education',    value: 17, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Social Media Platform Usage – Global (2023)',
        instruction: 'The pie chart below shows the share of global social media users across different platforms in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Social Media Users by Platform (2023)',
              segments: [
                { name: 'Facebook',  value: 29, color: '#3b82f6' },
                { name: 'YouTube',   value: 24, color: '#ef4444' },
                { name: 'Instagram', value: 22, color: '#ec4899' },
                { name: 'Other',     value: 25, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Household Waste by Category – UK (2022)',
        instruction: 'The pie chart below shows the breakdown of household waste by category in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Household Waste – UK (2022)',
              segments: [
                { name: 'Food',       value: 40, color: '#22c55e' },
                { name: 'Paper/Card', value: 25, color: '#f97316' },
                { name: 'Plastic',    value: 18, color: '#ef4444' },
                { name: 'Other',      value: 17, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      // ── Single pie (5–6 segments) ──
      {
        title: 'University Graduate Employment Outcomes – UK (2022)',
        instruction: 'The pie chart below shows the employment and activity outcomes of university graduates in the UK six months after graduation in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Graduate Outcomes – UK (2022)',
              segments: [
                { name: 'Full-Time Employment', value: 55, color: '#3b82f6' },
                { name: 'Part-Time Employment', value: 18, color: '#22c55e' },
                { name: 'Further Study',        value: 14, color: '#8b5cf6' },
                { name: 'Unemployed',           value: 8,  color: '#ef4444' },
                { name: 'Other',                value: 5,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Reasons for Absence – NHS Staff (2022)',
        instruction: 'The pie chart below shows the main reasons for staff absence in the National Health Service (NHS) in the UK in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'NHS Staff Absence Reasons (2022)',
              segments: [
                { name: 'Mental Health',         value: 30, color: '#8b5cf6' },
                { name: 'Back/Musculoskeletal',  value: 22, color: '#f97316' },
                { name: 'Respiratory',           value: 18, color: '#06b6d4' },
                { name: 'Other Illness',         value: 20, color: '#ef4444' },
                { name: 'Other',                 value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Plastic Production by Type (2022)',
        instruction: 'The pie chart below shows the breakdown of global plastic production by type in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Plastic Production by Type – Global (2022)',
              segments: [
                { name: 'Packaging',     value: 36, color: '#ef4444' },
                { name: 'Construction',  value: 16, color: '#f97316' },
                { name: 'Textiles',      value: 14, color: '#8b5cf6' },
                { name: 'Transport',     value: 10, color: '#3b82f6' },
                { name: 'Other',         value: 24, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Household Energy Sources – Canada (2021)',
        instruction: 'The pie chart below shows the main energy sources used by households in Canada in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Household Energy Sources – Canada (2021)',
              segments: [
                { name: 'Natural Gas',  value: 42, color: '#f97316' },
                { name: 'Electricity',  value: 34, color: '#3b82f6' },
                { name: 'Oil',          value: 12, color: '#64748b' },
                { name: 'Wood',         value: 6,  color: '#84cc16' },
                { name: 'Other',        value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Museum Visitors by Country of Origin – France (2022)',
        instruction: 'The pie chart below shows the countries of origin of visitors to major museums in France in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Museum Visitors by Origin – France (2022)',
              segments: [
                { name: 'France',  value: 40, color: '#3b82f6' },
                { name: 'UK',      value: 16, color: '#22c55e' },
                { name: 'Germany', value: 14, color: '#f97316' },
                { name: 'USA',     value: 12, color: '#ef4444' },
                { name: 'Other',   value: 18, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Hospital Admissions – UK (2022)',
        instruction: 'The pie chart below shows the main causes of non-scheduled hospital admissions in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Hospital Admissions by Cause – UK (2022)',
              segments: [
                { name: 'Injuries',        value: 28, color: '#ef4444' },
                { name: 'Cardiovascular',  value: 22, color: '#f97316' },
                { name: 'Respiratory',     value: 18, color: '#06b6d4' },
                { name: 'Mental Health',   value: 16, color: '#8b5cf6' },
                { name: 'Other',           value: 16, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Food Expenditure by Category – UK Households (2022)',
        instruction: 'The pie chart below shows how UK households distributed their food spending across different categories in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Food Expenditure by Category – UK (2022)',
              segments: [
                { name: 'Meat/Fish',    value: 28, color: '#ef4444' },
                { name: 'Dairy',        value: 22, color: '#f97316' },
                { name: 'Bakery',       value: 18, color: '#eab308' },
                { name: 'Fresh Produce',value: 20, color: '#22c55e' },
                { name: 'Other',        value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'International Students by Nationality – Australian Universities (2022)',
        instruction: 'The pie chart below shows the nationalities of international students enrolled at Australian universities in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'International Students by Nationality – Australia (2022)',
              segments: [
                { name: 'Chinese',    value: 30, color: '#ef4444' },
                { name: 'Indian',     value: 20, color: '#f97316' },
                { name: 'Australian', value: 18, color: '#22c55e' },
                { name: 'Other Asian',value: 16, color: '#3b82f6' },
                { name: 'Other',      value: 16, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global CO₂ Emissions by Country (2022)',
        instruction: 'The pie chart below shows the share of global CO₂ emissions produced by the largest emitting countries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Global CO₂ Emissions by Country (2022)',
              segments: [
                { name: 'China',  value: 31, color: '#ef4444' },
                { name: 'USA',    value: 15, color: '#3b82f6' },
                { name: 'India',  value: 7,  color: '#f97316' },
                { name: 'Russia', value: 5,  color: '#8b5cf6' },
                { name: 'Other',  value: 42, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Online Shopping Categories – UK (2023)',
        instruction: 'The pie chart below shows the proportion of online purchases made in different product categories by UK consumers in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Online Shopping by Category – UK (2023)',
              segments: [
                { name: 'Clothing',     value: 28, color: '#ec4899' },
                { name: 'Electronics',  value: 24, color: '#3b82f6' },
                { name: 'Food',         value: 18, color: '#22c55e' },
                { name: 'Home/Garden',  value: 16, color: '#f97316' },
                { name: 'Other',        value: 14, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Deforestation – Amazon Rainforest (2022)',
        instruction: 'The pie chart below shows the main causes of deforestation in the Amazon rainforest in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Amazon Deforestation Causes (2022)',
              segments: [
                { name: 'Cattle Ranching', value: 67, color: '#ef4444' },
                { name: 'Soya/Crops',      value: 11, color: '#22c55e' },
                { name: 'Logging',         value: 8,  color: '#f97316' },
                { name: 'Fire',            value: 7,  color: '#eab308' },
                { name: 'Other',           value: 7,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Sport Participation – UK Adults (2022)',
        instruction: 'The pie chart below shows the proportion of UK adults who participated in different sports or physical activities at least once a week in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Weekly Sport Participation – UK Adults (2022)',
              segments: [
                { name: 'Walking',   value: 32, color: '#22c55e' },
                { name: 'Gym',       value: 22, color: '#3b82f6' },
                { name: 'Swimming',  value: 18, color: '#06b6d4' },
                { name: 'Cycling',   value: 16, color: '#f97316' },
                { name: 'Other',     value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Household Debt – UK (2022)',
        instruction: 'The pie chart below shows the composition of household debt by type in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Household Debt by Type – UK (2022)',
              segments: [
                { name: 'Mortgage',       value: 58, color: '#3b82f6' },
                { name: 'Credit Cards',   value: 16, color: '#ef4444' },
                { name: 'Personal Loans', value: 12, color: '#f97316' },
                { name: 'Student Loans',  value: 8,  color: '#8b5cf6' },
                { name: 'Other',          value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Foreign Language Learners by Language – Europe (2022)',
        instruction: 'The pie chart below shows the distribution of foreign language learners in Europe by language studied in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Foreign Language Learners – Europe (2022)',
              segments: [
                { name: 'English', value: 36, color: '#3b82f6' },
                { name: 'Spanish', value: 22, color: '#f97316' },
                { name: 'French',  value: 18, color: '#22c55e' },
                { name: 'German',  value: 14, color: '#eab308' },
                { name: 'Other',   value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Reasons for Emigration – UK Nationals (2021)',
        instruction: 'The pie chart below shows the main reasons why UK nationals emigrated to live abroad in 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Reasons for Emigration – UK Nationals (2021)',
              segments: [
                { name: 'Work',       value: 38, color: '#3b82f6' },
                { name: 'Family',     value: 26, color: '#22c55e' },
                { name: 'Study',      value: 18, color: '#8b5cf6' },
                { name: 'Retirement', value: 12, color: '#f97316' },
                { name: 'Other',      value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Food Production by Region (2022)',
        instruction: 'The pie chart below shows the share of global food production by world region in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Global Food Production by Region (2022)',
              segments: [
                { name: 'Asia',     value: 43, color: '#f97316' },
                { name: 'Americas', value: 27, color: '#22c55e' },
                { name: 'Europe',   value: 17, color: '#3b82f6' },
                { name: 'Africa',   value: 8,  color: '#eab308' },
                { name: 'Other',    value: 5,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Sources of News – UK Adults (2023)',
        instruction: 'The pie chart below shows the main sources from which UK adults obtained their news in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'News Sources – UK Adults (2023)',
              segments: [
                { name: 'Online',       value: 38, color: '#3b82f6' },
                { name: 'Television',   value: 32, color: '#22c55e' },
                { name: 'Social Media', value: 16, color: '#ec4899' },
                { name: 'Radio',        value: 8,  color: '#f97316' },
                { name: 'Print',        value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Tourism Revenue by Region (2022)',
        instruction: 'The pie chart below shows the share of global international tourism revenue earned by different world regions in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Tourism Revenue by Region (2022)',
              segments: [
                { name: 'Europe',       value: 38, color: '#3b82f6' },
                { name: 'Asia-Pacific', value: 28, color: '#22c55e' },
                { name: 'Americas',     value: 22, color: '#f97316' },
                { name: 'Middle East',  value: 6,  color: '#eab308' },
                { name: 'Other',        value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Waste Disposal Methods – UK (2022)',
        instruction: 'The pie chart below shows the proportion of household waste disposed of by different methods in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Waste Disposal Methods – UK (2022)',
              segments: [
                { name: 'Recycling',        value: 44, color: '#22c55e' },
                { name: 'Landfill',         value: 32, color: '#64748b' },
                { name: 'Composting',       value: 12, color: '#84cc16' },
                { name: 'Energy Recovery',  value: 8,  color: '#f97316' },
                { name: 'Other',            value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Wildlife Decline – Global (2022)',
        instruction: 'The pie chart below shows the main causes of wildlife population decline worldwide in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Causes of Wildlife Decline (2022)',
              segments: [
                { name: 'Habitat Loss',    value: 50, color: '#22c55e' },
                { name: 'Overexploitation',value: 24, color: '#f97316' },
                { name: 'Climate Change',  value: 14, color: '#ef4444' },
                { name: 'Pollution',       value: 8,  color: '#8b5cf6' },
                { name: 'Other',           value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'UK Government Spending by Sector (2022)',
        instruction: 'The pie chart below shows how the UK government allocated its total spending across different sectors in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'UK Government Spending (2022)',
              segments: [
                { name: 'Social Protection', value: 34, color: '#3b82f6' },
                { name: 'Health',            value: 29, color: '#ef4444' },
                { name: 'Education',         value: 12, color: '#22c55e' },
                { name: 'Other',             value: 14, color: '#94a3b8' },
                { name: 'Defence',           value: 6,  color: '#64748b' },
                { name: 'Transport',         value: 5,  color: '#f97316' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Internet Users by Age Group (2023)',
        instruction: 'The pie chart below shows the distribution of global internet users across different age groups in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Internet Users by Age Group – Global (2023)',
              segments: [
                { name: '25–34', value: 26, color: '#3b82f6' },
                { name: '18–24', value: 22, color: '#22c55e' },
                { name: '35–44', value: 20, color: '#f97316' },
                { name: '45–54', value: 16, color: '#8b5cf6' },
                { name: '55–64', value: 10, color: '#eab308' },
                { name: '65+',   value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Smartphone App Categories by Time Spent – Global (2023)',
        instruction: 'The pie chart below shows the proportion of total smartphone app usage time spent on different app categories globally in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'App Usage by Category – Global (2023)',
              segments: [
                { name: 'Social Media',  value: 30, color: '#ec4899' },
                { name: 'Games',         value: 20, color: '#8b5cf6' },
                { name: 'Entertainment', value: 18, color: '#3b82f6' },
                { name: 'Utilities',     value: 14, color: '#94a3b8' },
                { name: 'Shopping',      value: 10, color: '#f97316' },
                { name: 'Other',         value: 8,  color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Pollution in UK Rivers (2022)',
        instruction: 'The pie chart below shows the sources of pollution found in UK rivers in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'River Pollution Types – UK (2022)',
              segments: [
                { name: 'Agricultural',  value: 38, color: '#22c55e' },
                { name: 'Sewage',        value: 28, color: '#64748b' },
                { name: 'Industrial',    value: 16, color: '#f97316' },
                { name: 'Urban Runoff',  value: 10, color: '#3b82f6' },
                { name: 'Mining',        value: 4,  color: '#94a3b8' },
                { name: 'Other',         value: 4,  color: '#a78bfa' },
              ],
            },
          ],
        },
      },
      {
        title: 'Higher Education Funding Sources – Australia (2022)',
        instruction: 'The pie chart below shows the main sources of funding for higher education institutions in Australia in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Higher Education Funding – Australia (2022)',
              segments: [
                { name: 'Student Fees',       value: 38, color: '#3b82f6' },
                { name: 'Government',         value: 30, color: '#22c55e' },
                { name: 'Research Grants',    value: 16, color: '#8b5cf6' },
                { name: 'Industry',           value: 8,  color: '#f97316' },
                { name: 'International Fees', value: 6,  color: '#eab308' },
                { name: 'Other',              value: 2,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Means of Payment – UK Consumers (2023)',
        instruction: 'The pie chart below shows how UK consumers paid for goods and services in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Payment Methods – UK (2023)',
              segments: [
                { name: 'Debit Card',     value: 42, color: '#3b82f6' },
                { name: 'Contactless',    value: 24, color: '#22c55e' },
                { name: 'Credit Card',    value: 16, color: '#f97316' },
                { name: 'Bank Transfer',  value: 10, color: '#8b5cf6' },
                { name: 'Cash',           value: 6,  color: '#eab308' },
                { name: 'Other',          value: 2,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Food Import Categories – UK (2022)',
        instruction: 'The pie chart below shows the breakdown of UK food imports by product category in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Food Import Categories – UK (2022)',
              segments: [
                { name: 'Fruit & Vegetables', value: 35, color: '#22c55e' },
                { name: 'Meat',               value: 28, color: '#ef4444' },
                { name: 'Dairy',              value: 16, color: '#f97316' },
                { name: 'Fish',               value: 10, color: '#06b6d4' },
                { name: 'Cereals',            value: 7,  color: '#eab308' },
                { name: 'Other',              value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Workplace Injury – UK (2022)',
        instruction: 'The pie chart below shows the types of injuries sustained by workers in UK workplaces in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Workplace Injuries by Type – UK (2022)',
              segments: [
                { name: 'Slips/Trips',      value: 34, color: '#ef4444' },
                { name: 'Manual Handling',  value: 26, color: '#f97316' },
                { name: 'Being Hit',        value: 16, color: '#3b82f6' },
                { name: 'Falls',            value: 14, color: '#8b5cf6' },
                { name: 'Other',            value: 6,  color: '#94a3b8' },
                { name: 'Burns',            value: 4,  color: '#eab308' },
              ],
            },
          ],
        },
      },
      {
        title: 'Sources of Air Pollution – UK (2022)',
        instruction: 'The pie chart below shows the main sources contributing to air pollution in the United Kingdom in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Air Pollution Sources – UK (2022)',
              segments: [
                { name: 'Road Transport',        value: 34, color: '#f97316' },
                { name: 'Domestic Combustion',   value: 28, color: '#64748b' },
                { name: 'Agriculture',           value: 16, color: '#22c55e' },
                { name: 'Industry',              value: 12, color: '#ef4444' },
                { name: 'Other',                 value: 6,  color: '#94a3b8' },
                { name: 'Aviation',              value: 4,  color: '#3b82f6' },
              ],
            },
          ],
        },
      },
      {
        title: 'Child Screen Time Activities – UK (2023)',
        instruction: 'The pie chart below shows how children aged 5–15 in the UK spent their daily screen time across different activities in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: 'Child Screen Time Activities – UK (2023)',
              segments: [
                { name: 'Video Watching', value: 38, color: '#3b82f6' },
                { name: 'Gaming',         value: 24, color: '#8b5cf6' },
                { name: 'Social Media',   value: 18, color: '#ec4899' },
                { name: 'Educational',    value: 12, color: '#22c55e' },
                { name: 'Music',          value: 5,  color: '#f97316' },
                { name: 'Other',          value: 3,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      // ── Double pie (before / after or two time points) ──
      {
        title: 'Electricity Sources – Germany (2000 vs 2022)',
        instruction: 'The pie charts below show the proportion of electricity generated from different sources in Germany in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Coal',       value: 52, color: '#64748b' },
                { name: 'Nuclear',    value: 30, color: '#8b5cf6' },
                { name: 'Gas',        value: 10, color: '#f97316' },
                { name: 'Renewables', value: 8,  color: '#22c55e' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Wind',    value: 28, color: '#06b6d4' },
                { name: 'Gas',     value: 15, color: '#f97316' },
                { name: 'Coal',    value: 22, color: '#64748b' },
                { name: 'Nuclear', value: 12, color: '#8b5cf6' },
                { name: 'Solar',   value: 10, color: '#eab308' },
                { name: 'Other',   value: 13, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Diet Composition – UK Adults (2000 vs 2022)',
        instruction: 'The pie charts below show the composition of the average UK adult\'s diet by food group in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Meat/Fish',   value: 35, color: '#ef4444' },
                { name: 'Grains',      value: 28, color: '#eab308' },
                { name: 'Dairy',       value: 22, color: '#f97316' },
                { name: 'Fruit/Veg',   value: 15, color: '#22c55e' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Meat/Fish',   value: 25, color: '#ef4444' },
                { name: 'Grains',      value: 26, color: '#eab308' },
                { name: 'Dairy',       value: 18, color: '#f97316' },
                { name: 'Fruit/Veg',   value: 20, color: '#22c55e' },
                { name: 'Plant-Based', value: 11, color: '#84cc16' },
              ],
            },
          ],
        },
      },
      {
        title: 'Transport Mode – Daily Commute, City X (2005 vs 2023)',
        instruction: 'The pie charts below show the main modes of transport used by daily commuters in a city in 2005 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2005',
              segments: [
                { name: 'Car',     value: 58, color: '#f97316' },
                { name: 'Bus',     value: 22, color: '#3b82f6' },
                { name: 'Walking', value: 12, color: '#22c55e' },
                { name: 'Cycling', value: 5,  color: '#eab308' },
                { name: 'Rail',    value: 3,  color: '#8b5cf6' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Car',     value: 38, color: '#f97316' },
                { name: 'Bus',     value: 26, color: '#3b82f6' },
                { name: 'Cycling', value: 14, color: '#eab308' },
                { name: 'Walking', value: 14, color: '#22c55e' },
                { name: 'Rail',    value: 8,  color: '#8b5cf6' },
              ],
            },
          ],
        },
      },
      {
        title: 'Agricultural Land Use – Farmland (1980 vs 2020)',
        instruction: 'The pie charts below show how farmland was used in a region in 1980 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '1980',
              segments: [
                { name: 'Crops',   value: 55, color: '#22c55e' },
                { name: 'Pasture', value: 30, color: '#84cc16' },
                { name: 'Fallow',  value: 10, color: '#eab308' },
                { name: 'Other',   value: 5,  color: '#94a3b8' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Crops',   value: 62, color: '#22c55e' },
                { name: 'Pasture', value: 22, color: '#84cc16' },
                { name: 'Fallow',  value: 6,  color: '#eab308' },
                { name: 'Other',   value: 10, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'University Subject Choices – UK (2000 vs 2022)',
        instruction: 'The pie charts below show the distribution of undergraduate students by subject area at UK universities in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'STEM',         value: 30, color: '#22c55e' },
                { name: 'Arts/Hum.',    value: 24, color: '#f97316' },
                { name: 'Business',     value: 18, color: '#3b82f6' },
                { name: 'Law',          value: 12, color: '#8b5cf6' },
                { name: 'Medical',      value: 10, color: '#ef4444' },
                { name: 'Other',        value: 6,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'STEM',         value: 38, color: '#22c55e' },
                { name: 'Arts/Hum.',    value: 18, color: '#f97316' },
                { name: 'Business',     value: 22, color: '#3b82f6' },
                { name: 'Law',          value: 10, color: '#8b5cf6' },
                { name: 'Medical',      value: 8,  color: '#ef4444' },
                { name: 'Other',        value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Energy Use – Manufacturing Industry (2000 vs 2022)',
        instruction: 'The pie charts below show the sources of energy used by the manufacturing industry in a country in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Gas',         value: 48, color: '#f97316' },
                { name: 'Coal',        value: 28, color: '#64748b' },
                { name: 'Oil',         value: 16, color: '#eab308' },
                { name: 'Electricity', value: 8,  color: '#3b82f6' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Gas',         value: 35, color: '#f97316' },
                { name: 'Electricity', value: 26, color: '#3b82f6' },
                { name: 'Coal',        value: 15, color: '#64748b' },
                { name: 'Oil',         value: 12, color: '#eab308' },
                { name: 'Renewables',  value: 12, color: '#22c55e' },
              ],
            },
          ],
        },
      },
      {
        title: 'Electric Vehicle Brand Market Share (2018 vs 2023)',
        instruction: 'The pie charts below show the global market share of electric vehicle brands in 2018 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2018',
              segments: [
                { name: 'Tesla',   value: 62, color: '#ef4444' },
                { name: 'Renault', value: 14, color: '#22c55e' },
                { name: 'BMW',     value: 10, color: '#3b82f6' },
                { name: 'Others',  value: 14, color: '#94a3b8' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Tesla',   value: 22, color: '#ef4444' },
                { name: 'BYD',     value: 18, color: '#f97316' },
                { name: 'VW',      value: 14, color: '#3b82f6' },
                { name: 'BMW',     value: 12, color: '#8b5cf6' },
                { name: 'Others',  value: 34, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Sources of News – USA Adults (2010 vs 2023)',
        instruction: 'The pie charts below show where adults in the United States obtained their news in 2010 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Television', value: 65, color: '#3b82f6' },
                { name: 'Newspaper',  value: 20, color: '#64748b' },
                { name: 'Radio',      value: 10, color: '#f97316' },
                { name: 'Online',     value: 5,  color: '#22c55e' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Online',       value: 42, color: '#22c55e' },
                { name: 'Television',   value: 32, color: '#3b82f6' },
                { name: 'Social Media', value: 16, color: '#ec4899' },
                { name: 'Newspaper',    value: 6,  color: '#64748b' },
                { name: 'Radio',        value: 4,  color: '#f97316' },
              ],
            },
          ],
        },
      },
      {
        title: 'Water Source Usage – Kenya (2000 vs 2020)',
        instruction: 'The pie charts below show the main sources of water used by households in Kenya in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'River/Lake', value: 52, color: '#06b6d4' },
                { name: 'Well',       value: 28, color: '#22c55e' },
                { name: 'Spring',     value: 12, color: '#84cc16' },
                { name: 'Piped',      value: 8,  color: '#3b82f6' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Piped',     value: 38, color: '#3b82f6' },
                { name: 'Well',      value: 32, color: '#22c55e' },
                { name: 'River/Lake',value: 18, color: '#06b6d4' },
                { name: 'Spring',    value: 8,  color: '#84cc16' },
                { name: 'Rainwater', value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Household Expenditure – UK (2000 vs 2022)',
        instruction: 'The pie charts below show the breakdown of household expenditure in the UK by category in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Housing',   value: 26, color: '#ef4444' },
                { name: 'Food',      value: 24, color: '#22c55e' },
                { name: 'Transport', value: 18, color: '#3b82f6' },
                { name: 'Leisure',   value: 16, color: '#8b5cf6' },
                { name: 'Clothing',  value: 10, color: '#ec4899' },
                { name: 'Other',     value: 6,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Housing',   value: 32, color: '#ef4444' },
                { name: 'Food',      value: 20, color: '#22c55e' },
                { name: 'Transport', value: 16, color: '#3b82f6' },
                { name: 'Leisure',   value: 18, color: '#8b5cf6' },
                { name: 'Clothing',  value: 7,  color: '#ec4899' },
                { name: 'Other',     value: 7,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Global Arms Exports by Country (2000 vs 2022)',
        instruction: 'The pie charts below show the share of global arms exports by country in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'USA',    value: 40, color: '#3b82f6' },
                { name: 'Russia', value: 24, color: '#ef4444' },
                { name: 'UK',     value: 12, color: '#22c55e' },
                { name: 'France', value: 10, color: '#f97316' },
                { name: 'Other',  value: 14, color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'USA',     value: 42, color: '#3b82f6' },
                { name: 'Russia',  value: 16, color: '#ef4444' },
                { name: 'France',  value: 14, color: '#f97316' },
                { name: 'Germany', value: 8,  color: '#eab308' },
                { name: 'Other',   value: 20, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Employee Skills in Demand – UK (2015 vs 2023)',
        instruction: 'The pie charts below show the proportion of job vacancies in the UK requiring different skill types in 2015 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2015',
              segments: [
                { name: 'Technical',      value: 35, color: '#3b82f6' },
                { name: 'Communication',  value: 28, color: '#22c55e' },
                { name: 'Analytical',     value: 22, color: '#8b5cf6' },
                { name: 'Creative',       value: 10, color: '#ec4899' },
                { name: 'Other',          value: 5,  color: '#94a3b8' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Digital/AI',    value: 38, color: '#3b82f6' },
                { name: 'Communication', value: 24, color: '#22c55e' },
                { name: 'Analytical',    value: 20, color: '#8b5cf6' },
                { name: 'Creative',      value: 14, color: '#ec4899' },
                { name: 'Other',         value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Plastic Packaging Composition (2010 vs 2022)',
        instruction: 'The pie charts below show the composition of plastic packaging by polymer type in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'PET',   value: 35, color: '#3b82f6' },
                { name: 'HDPE',  value: 28, color: '#22c55e' },
                { name: 'PVC',   value: 16, color: '#ef4444' },
                { name: 'PP',    value: 12, color: '#f97316' },
                { name: 'Other', value: 9,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'PET',          value: 28, color: '#3b82f6' },
                { name: 'HDPE',         value: 22, color: '#22c55e' },
                { name: 'PP',           value: 22, color: '#f97316' },
                { name: 'Bio-plastic',  value: 16, color: '#84cc16' },
                { name: 'Other',        value: 12, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'University Funding Sources – Australia (2005 vs 2022)',
        instruction: 'The pie charts below show the main sources of funding for universities in Australia in 2005 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2005',
              segments: [
                { name: 'Government',   value: 58, color: '#22c55e' },
                { name: 'Student Fees', value: 28, color: '#3b82f6' },
                { name: 'Industry',     value: 8,  color: '#f97316' },
                { name: 'Other',        value: 6,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Student Fees',      value: 46, color: '#3b82f6' },
                { name: 'Government',        value: 34, color: '#22c55e' },
                { name: 'Industry',          value: 12, color: '#f97316' },
                { name: 'International Fees',value: 8,  color: '#eab308' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Child Mortality – Global (2000 vs 2020)',
        instruction: 'The pie charts below show the main causes of child mortality worldwide in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Neonatal',    value: 36, color: '#3b82f6' },
                { name: 'Pneumonia',   value: 22, color: '#f97316' },
                { name: 'Malaria',     value: 16, color: '#22c55e' },
                { name: 'Diarrhoea',   value: 14, color: '#eab308' },
                { name: 'Other',       value: 12, color: '#94a3b8' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Neonatal',    value: 48, color: '#3b82f6' },
                { name: 'Pneumonia',   value: 18, color: '#f97316' },
                { name: 'Diarrhoea',   value: 10, color: '#eab308' },
                { name: 'Malaria',     value: 8,  color: '#22c55e' },
                { name: 'Other',       value: 16, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Internet Usage Purpose – Global (2010 vs 2023)',
        instruction: 'The pie charts below show the main purposes for which people used the internet globally in 2010 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Email',        value: 38, color: '#3b82f6' },
                { name: 'News',         value: 28, color: '#22c55e' },
                { name: 'Social Media', value: 16, color: '#ec4899' },
                { name: 'Shopping',     value: 10, color: '#f97316' },
                { name: 'Other',        value: 8,  color: '#94a3b8' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Social Media',      value: 34, color: '#ec4899' },
                { name: 'Video Streaming',   value: 28, color: '#3b82f6' },
                { name: 'Shopping',          value: 18, color: '#f97316' },
                { name: 'Email',             value: 12, color: '#22c55e' },
                { name: 'Other',             value: 8,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Energy Production – South Korea (2000 vs 2022)',
        instruction: 'The pie charts below show the sources of electricity production in South Korea in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Coal',    value: 40, color: '#64748b' },
                { name: 'Nuclear', value: 34, color: '#8b5cf6' },
                { name: 'Gas',     value: 16, color: '#f97316' },
                { name: 'Oil',     value: 8,  color: '#eab308' },
                { name: 'Other',   value: 2,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Coal',        value: 30, color: '#64748b' },
                { name: 'Nuclear',     value: 28, color: '#8b5cf6' },
                { name: 'Gas',         value: 28, color: '#f97316' },
                { name: 'Renewables',  value: 12, color: '#22c55e' },
                { name: 'Other',       value: 2,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Recycling Composition by Material – UK (2010 vs 2022)',
        instruction: 'The pie charts below show the breakdown of recycled materials by type in the United Kingdom in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Paper',   value: 38, color: '#f97316' },
                { name: 'Glass',   value: 26, color: '#06b6d4' },
                { name: 'Metal',   value: 18, color: '#94a3b8' },
                { name: 'Plastic', value: 10, color: '#ef4444' },
                { name: 'Other',   value: 8,  color: '#64748b' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Paper',   value: 32, color: '#f97316' },
                { name: 'Glass',   value: 22, color: '#06b6d4' },
                { name: 'Plastic', value: 20, color: '#ef4444' },
                { name: 'Metal',   value: 16, color: '#94a3b8' },
                { name: 'Organic', value: 10, color: '#22c55e' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Retail Shopping – UK (2015 vs 2023)',
        instruction: 'The pie charts below show how UK consumers shopped for goods by retail method in 2015 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2015',
              segments: [
                { name: 'In-Store',  value: 78, color: '#3b82f6' },
                { name: 'Online',    value: 16, color: '#22c55e' },
                { name: 'Catalogue', value: 4,  color: '#f97316' },
                { name: 'Other',     value: 2,  color: '#94a3b8' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'In-Store',      value: 48, color: '#3b82f6' },
                { name: 'Online',        value: 44, color: '#22c55e' },
                { name: 'Click&Collect', value: 6,  color: '#f97316' },
                { name: 'Other',         value: 2,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Reasons for Urban Migration (2000 vs 2020)',
        instruction: 'The pie charts below show the main reasons why people migrated to urban areas in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Employment', value: 52, color: '#3b82f6' },
                { name: 'Education',  value: 28, color: '#22c55e' },
                { name: 'Family',     value: 12, color: '#f97316' },
                { name: 'Other',      value: 8,  color: '#94a3b8' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Employment',       value: 44, color: '#3b82f6' },
                { name: 'Education',        value: 22, color: '#22c55e' },
                { name: 'Conflict/Climate', value: 18, color: '#ef4444' },
                { name: 'Family',           value: 12, color: '#f97316' },
                { name: 'Other',            value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Food Production Methods – UK (2005 vs 2022)',
        instruction: 'The pie charts below show the proportion of food produced by different farming methods in the UK in 2005 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2005',
              segments: [
                { name: 'Conventional', value: 84, color: '#f97316' },
                { name: 'Organic',      value: 10, color: '#22c55e' },
                { name: 'Other',        value: 6,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Conventional',     value: 68, color: '#f97316' },
                { name: 'Organic',          value: 22, color: '#22c55e' },
                { name: 'Vertical Farming', value: 6,  color: '#84cc16' },
                { name: 'Other',            value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Healthcare Expenditure by Category – Canada (2000 vs 2022)',
        instruction: 'The pie charts below show how healthcare spending was distributed across different categories in Canada in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Hospital',   value: 38, color: '#3b82f6' },
                { name: 'Physician',  value: 24, color: '#22c55e' },
                { name: 'Medication', value: 18, color: '#f97316' },
                { name: 'Other',      value: 20, color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Hospital',       value: 32, color: '#3b82f6' },
                { name: 'Physician',      value: 22, color: '#22c55e' },
                { name: 'Medication',     value: 26, color: '#f97316' },
                { name: 'Long-term Care', value: 12, color: '#8b5cf6' },
                { name: 'Other',          value: 8,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Music Consumption Method – USA (2010 vs 2023)',
        instruction: 'The pie charts below show how people in the United States consumed music in 2010 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'CD/Physical',     value: 48, color: '#64748b' },
                { name: 'Digital Download', value: 30, color: '#3b82f6' },
                { name: 'Radio',           value: 18, color: '#f97316' },
                { name: 'Streaming',       value: 4,  color: '#22c55e' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: 'Streaming',       value: 82, color: '#22c55e' },
                { name: 'Radio',           value: 10, color: '#f97316' },
                { name: 'Digital Download', value: 6, color: '#3b82f6' },
                { name: 'Physical',        value: 2,  color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Overseas Students at UK Universities by Region (2010 vs 2022)',
        instruction: 'The pie charts below show the regional origins of overseas students enrolled at UK universities in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Asia',        value: 42, color: '#f97316' },
                { name: 'EU',          value: 28, color: '#3b82f6' },
                { name: 'Americas',    value: 16, color: '#22c55e' },
                { name: 'Middle East', value: 8,  color: '#eab308' },
                { name: 'Other',       value: 6,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Asia',        value: 52, color: '#f97316' },
                { name: 'EU',          value: 14, color: '#3b82f6' },
                { name: 'Americas',    value: 18, color: '#22c55e' },
                { name: 'Middle East', value: 10, color: '#eab308' },
                { name: 'Other',       value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Agricultural Land Use – India (2000 vs 2020)',
        instruction: 'The pie charts below show how agricultural land was used in India in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Wheat/Rice',  value: 48, color: '#eab308' },
                { name: 'Cash Crops',  value: 20, color: '#f97316' },
                { name: 'Pulses',      value: 18, color: '#22c55e' },
                { name: 'Fallow',      value: 14, color: '#94a3b8' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Wheat/Rice',  value: 44, color: '#eab308' },
                { name: 'Cash Crops',  value: 26, color: '#f97316' },
                { name: 'Pulses',      value: 14, color: '#22c55e' },
                { name: 'Fallow',      value: 10, color: '#94a3b8' },
                { name: 'Horticulture',value: 6,  color: '#84cc16' },
              ],
            },
          ],
        },
      },
      {
        title: 'Smartphone Ownership by Age – UK (2015 vs 2023)',
        instruction: 'The pie charts below show the distribution of smartphone ownership across age groups in the United Kingdom in 2015 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2015',
              segments: [
                { name: '16–24', value: 40, color: '#3b82f6' },
                { name: '25–34', value: 28, color: '#22c55e' },
                { name: '35–54', value: 22, color: '#f97316' },
                { name: '55+',   value: 10, color: '#94a3b8' },
              ],
            },
            {
              title: '2023',
              segments: [
                { name: '35–54', value: 30, color: '#f97316' },
                { name: '25–34', value: 26, color: '#22c55e' },
                { name: '16–24', value: 28, color: '#3b82f6' },
                { name: '55+',   value: 16, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Research Funding Sources – USA (2010 vs 2022)',
        instruction: 'The pie charts below show the sources of funding for scientific research in the United States in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Federal Government', value: 58, color: '#3b82f6' },
                { name: 'Industry',           value: 30, color: '#f97316' },
                { name: 'Universities',       value: 8,  color: '#22c55e' },
                { name: 'Other',              value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Industry',           value: 44, color: '#f97316' },
                { name: 'Federal Government', value: 42, color: '#3b82f6' },
                { name: 'Universities',       value: 10, color: '#22c55e' },
                { name: 'Other',              value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Student Accommodation Type – UK (2010 vs 2022)',
        instruction: 'The pie charts below show the types of accommodation used by university students in the UK in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'University Hall',  value: 52, color: '#3b82f6' },
                { name: 'Private Rented',   value: 32, color: '#f97316' },
                { name: 'Family Home',      value: 12, color: '#22c55e' },
                { name: 'Other',            value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Private Rented',  value: 46, color: '#f97316' },
                { name: 'University Hall', value: 38, color: '#3b82f6' },
                { name: 'Family Home',     value: 12, color: '#22c55e' },
                { name: 'Other',           value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Social Media Platform Usage – UK Teenagers (2015 vs 2022)',
        instruction: 'The pie charts below show the most-used social media platforms among UK teenagers in 2015 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2015',
              segments: [
                { name: 'Facebook',  value: 48, color: '#3b82f6' },
                { name: 'Twitter',   value: 24, color: '#06b6d4' },
                { name: 'Instagram', value: 16, color: '#ec4899' },
                { name: 'Snapchat',  value: 8,  color: '#eab308' },
                { name: 'Other',     value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'TikTok',    value: 38, color: '#64748b' },
                { name: 'Instagram', value: 32, color: '#ec4899' },
                { name: 'Snapchat',  value: 16, color: '#eab308' },
                { name: 'Twitter',   value: 8,  color: '#06b6d4' },
                { name: 'Other',     value: 6,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Energy Sources – Australia (2010 vs 2022)',
        instruction: 'The pie charts below show the sources of electricity generation in Australia in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Coal',  value: 68, color: '#64748b' },
                { name: 'Gas',   value: 20, color: '#f97316' },
                { name: 'Hydro', value: 7,  color: '#06b6d4' },
                { name: 'Other', value: 5,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Coal',  value: 46, color: '#64748b' },
                { name: 'Gas',   value: 22, color: '#f97316' },
                { name: 'Solar', value: 16, color: '#eab308' },
                { name: 'Wind',  value: 12, color: '#22c55e' },
                { name: 'Other', value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Occupation Types – Japan (2000 vs 2020)',
        instruction: 'The pie charts below show the distribution of workers across occupation types in Japan in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Services',      value: 36, color: '#3b82f6' },
                { name: 'Manufacturing', value: 28, color: '#f97316' },
                { name: 'Construction',  value: 14, color: '#94a3b8' },
                { name: 'Agriculture',   value: 12, color: '#22c55e' },
                { name: 'Other',         value: 10, color: '#64748b' },
              ],
            },
            {
              title: '2020',
              segments: [
                { name: 'Services',      value: 52, color: '#3b82f6' },
                { name: 'Manufacturing', value: 18, color: '#f97316' },
                { name: 'Construction',  value: 12, color: '#94a3b8' },
                { name: 'Agriculture',   value: 6,  color: '#22c55e' },
                { name: 'Other',         value: 12, color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Meal Preparation Method – UK Households (2005 vs 2022)',
        instruction: 'The pie charts below show how households in the UK prepared their main meals in 2005 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2005',
              segments: [
                { name: 'Home-cooked', value: 66, color: '#22c55e' },
                { name: 'Ready Meals', value: 20, color: '#f97316' },
                { name: 'Takeaway',    value: 10, color: '#ef4444' },
                { name: 'Other',       value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Home-cooked',      value: 48, color: '#22c55e' },
                { name: 'Ready Meals',      value: 24, color: '#f97316' },
                { name: 'Takeaway',         value: 22, color: '#ef4444' },
                { name: 'Food Delivery App',value: 6,  color: '#8b5cf6' },
              ],
            },
          ],
        },
      },
      {
        title: 'International Trade Partners – UK (2005 vs 2022)',
        instruction: 'The pie charts below show the UK\'s share of international trade with different global partners in 2005 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2005',
              segments: [
                { name: 'EU',            value: 52, color: '#3b82f6' },
                { name: 'USA',           value: 18, color: '#22c55e' },
                { name: 'China',         value: 8,  color: '#ef4444' },
                { name: 'Rest of World', value: 22, color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'EU',            value: 42, color: '#3b82f6' },
                { name: 'USA',           value: 22, color: '#22c55e' },
                { name: 'China',         value: 12, color: '#ef4444' },
                { name: 'Rest of World', value: 24, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Electricity Sources – France (2000 vs 2022)',
        instruction: 'The pie charts below show the sources of electricity generation in France in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Nuclear', value: 76, color: '#8b5cf6' },
                { name: 'Hydro',   value: 14, color: '#06b6d4' },
                { name: 'Gas',     value: 6,  color: '#f97316' },
                { name: 'Other',   value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Nuclear', value: 62, color: '#8b5cf6' },
                { name: 'Hydro',   value: 12, color: '#06b6d4' },
                { name: 'Wind',    value: 12, color: '#22c55e' },
                { name: 'Solar',   value: 10, color: '#eab308' },
                { name: 'Other',   value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Causes of Rainforest Habitat Loss (2000 vs 2022)',
        instruction: 'The pie charts below show the main causes of habitat loss in the world\'s rainforests in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2000',
              segments: [
                { name: 'Agriculture',    value: 68, color: '#22c55e' },
                { name: 'Logging',        value: 18, color: '#f97316' },
                { name: 'Infrastructure', value: 10, color: '#94a3b8' },
                { name: 'Other',          value: 4,  color: '#64748b' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Agriculture',    value: 74, color: '#22c55e' },
                { name: 'Logging',        value: 12, color: '#f97316' },
                { name: 'Infrastructure', value: 8,  color: '#94a3b8' },
                { name: 'Fire',           value: 4,  color: '#ef4444' },
                { name: 'Other',          value: 2,  color: '#64748b' },
              ],
            },
          ],
        },
      },
      {
        title: 'Reasons for Doctor Visits – Australia (2010 vs 2022)',
        instruction: 'The pie charts below show the main reasons why people visited a doctor in Australia in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Respiratory',      value: 28, color: '#06b6d4' },
                { name: 'Musculoskeletal',  value: 22, color: '#f97316' },
                { name: 'Cardiovascular',   value: 18, color: '#ef4444' },
                { name: 'Mental Health',    value: 14, color: '#8b5cf6' },
                { name: 'Other',            value: 18, color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Mental Health',   value: 26, color: '#8b5cf6' },
                { name: 'Respiratory',     value: 24, color: '#06b6d4' },
                { name: 'Musculoskeletal', value: 20, color: '#f97316' },
                { name: 'Cardiovascular',  value: 16, color: '#ef4444' },
                { name: 'Other',           value: 14, color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Bank Account Types Held – UK Adults (2010 vs 2022)',
        instruction: 'The pie charts below show the types of bank accounts held by adults in the United Kingdom in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Current Account', value: 52, color: '#3b82f6' },
                { name: 'Savings',         value: 34, color: '#22c55e' },
                { name: 'ISA',             value: 10, color: '#f97316' },
                { name: 'Other',           value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Current Account', value: 44, color: '#3b82f6' },
                { name: 'Savings',         value: 26, color: '#22c55e' },
                { name: 'ISA',             value: 16, color: '#f97316' },
                { name: 'Investment',      value: 10, color: '#8b5cf6' },
                { name: 'Other',           value: 4,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Types of Employment Contract – UK (2010 vs 2022)',
        instruction: 'The pie charts below show the proportion of workers in the UK holding different types of employment contracts in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Full-Time Permanent', value: 62, color: '#3b82f6' },
                { name: 'Part-Time',           value: 22, color: '#22c55e' },
                { name: 'Temporary',           value: 10, color: '#f97316' },
                { name: 'Self-Employed',       value: 6,  color: '#8b5cf6' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Full-Time Permanent', value: 52, color: '#3b82f6' },
                { name: 'Part-Time',           value: 20, color: '#22c55e' },
                { name: 'Self-Employed',       value: 14, color: '#8b5cf6' },
                { name: 'Temporary',           value: 8,  color: '#f97316' },
                { name: 'Zero-Hours',          value: 6,  color: '#ef4444' },
              ],
            },
          ],
        },
      },
      {
        title: 'Primary School Subject Time Allocation – UK (2010 vs 2022)',
        instruction: 'The pie charts below show how weekly teaching time was allocated across subjects in UK primary schools in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Literacy',   value: 32, color: '#3b82f6' },
                { name: 'Numeracy',   value: 28, color: '#22c55e' },
                { name: 'Science',    value: 18, color: '#f97316' },
                { name: 'PE',         value: 12, color: '#ef4444' },
                { name: 'Other',      value: 10, color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Literacy',          value: 28, color: '#3b82f6' },
                { name: 'Numeracy',          value: 24, color: '#22c55e' },
                { name: 'Science',           value: 16, color: '#f97316' },
                { name: 'PE',                value: 12, color: '#ef4444' },
                { name: 'PSHE/Computing',    value: 12, color: '#8b5cf6' },
                { name: 'Other',             value: 8,  color: '#94a3b8' },
              ],
            },
          ],
        },
      },
      {
        title: 'Tourism Spending by Category – Visitors to UK (2010 vs 2022)',
        instruction: 'The pie charts below show how international visitors to the United Kingdom spent their money across different categories in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'pie',
          charts: [
            {
              title: '2010',
              segments: [
                { name: 'Accommodation', value: 38, color: '#3b82f6' },
                { name: 'Food/Drink',    value: 28, color: '#22c55e' },
                { name: 'Shopping',      value: 20, color: '#f97316' },
                { name: 'Transport',     value: 10, color: '#8b5cf6' },
                { name: 'Other',         value: 4,  color: '#94a3b8' },
              ],
            },
            {
              title: '2022',
              segments: [
                { name: 'Accommodation', value: 32, color: '#3b82f6' },
                { name: 'Shopping',      value: 26, color: '#f97316' },
                { name: 'Food/Drink',    value: 24, color: '#22c55e' },
                { name: 'Transport',     value: 10, color: '#8b5cf6' },
                { name: 'Experiences',   value: 8,  color: '#ec4899' },
              ],
            },
          ],
        },
      },
    ],
  },

  /* ═══════════════════ MAP DIAGRAM ═══════════════════ */
  {
    type: 'map',
    label: 'Map Diagram',
    description: 'Describe changes to a location or compare two places.',
    color: 'teal',
    prompts: [
      {
        title: 'Village of Elmwood (1970 vs 2015)',
        instruction: 'The maps below show the village of Elmwood in 1970 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1970',
              elements: [
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 115 },
                { label: 'Main Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 115, w: 400, h: 12 },
                { label: 'Church', color: '#bfdbfe', textColor: '#1e3a8a', x: 10, y: 135, w: 90, h: 65 },
                { label: 'Village\nHouses (~80)', color: '#fdba74', textColor: '#7c2d12', x: 110, y: 135, w: 180, h: 65 },
                { label: 'Village Pub', color: '#fde68a', textColor: '#78350f', x: 300, y: 135, w: 90, h: 65 },
                { label: 'Meadow', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 210, w: 400, h: 90 },
              ],
            },
            {
              label: '2015',
              elements: [
                { label: 'Housing\nEstate (350)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 115 },
                { label: 'Solar Farm', color: '#fef08a', textColor: '#78350f', x: 205, y: 0, w: 195, h: 115 },
                { label: 'Main Road\n(widened)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 115, w: 400, h: 14 },
                { label: 'Church', color: '#bfdbfe', textColor: '#1e3a8a', x: 10, y: 137, w: 90, h: 65 },
                { label: 'Original\nHouses + Ext.', color: '#fdba74', textColor: '#7c2d12', x: 110, y: 137, w: 180, h: 65 },
                { label: 'Supermarket', color: '#ddd6fe', textColor: '#4c1d95', x: 300, y: 137, w: 90, h: 65 },
                { label: 'Community\nPark', color: '#86efac', textColor: '#166534', x: 0, y: 212, w: 195, h: 88 },
                { label: 'New Primary\nSchool', color: '#93c5fd', textColor: '#1e3a8a', x: 205, y: 212, w: 195, h: 88 },
              ],
            },
          ],
        },
      },
      {
        title: 'Market Town of Greystone (1985 vs 2022)',
        instruction: 'The maps below show the market town of Greystone in 1985 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1985',
              elements: [
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Main Road (N–S)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 80, w: 400, h: 12 },
                { label: 'Market\nSquare', color: '#fef08a', textColor: '#713f12', x: 0, y: 100, w: 130, h: 80 },
                { label: 'Residential\nHouses (~150)', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 100, w: 120, h: 80 },
                { label: 'Church &\nCemetery', color: '#bfdbfe', textColor: '#1e3a8a', x: 270, y: 100, w: 130, h: 80 },
                { label: 'River Grey', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 192, w: 400, h: 28 },
                { label: 'Bridge', color: '#6b7280', textColor: '#fff', x: 180, y: 192, w: 40, h: 28 },
                { label: 'Meadow', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 228, w: 400, h: 72 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Housing Estate\n(480 homes)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 250, h: 80 },
                { label: 'Retail Park', color: '#ddd6fe', textColor: '#4c1d95', x: 260, y: 0, w: 140, h: 80 },
                { label: 'Bypass Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 80, w: 400, h: 12 },
                { label: 'Market\nSquare', color: '#fef08a', textColor: '#713f12', x: 0, y: 100, w: 130, h: 80 },
                { label: 'New Apartments\n(+ old houses)', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 100, w: 120, h: 80 },
                { label: 'Church &\nCemetery', color: '#bfdbfe', textColor: '#1e3a8a', x: 270, y: 100, w: 130, h: 80 },
                { label: 'River Grey', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 192, w: 400, h: 28 },
                { label: 'Flood\nDefence Wall', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 224, w: 400, h: 10 },
                { label: 'Riverside Park\n& Cycle Path', color: '#86efac', textColor: '#166534', x: 0, y: 238, w: 400, h: 62 },
              ],
            },
          ],
        },
      },
      {
        title: 'Fishing Village of Crabstone (1975 vs 2020)',
        instruction: 'The maps below show the fishing village of Crabstone in 1975 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1975',
              elements: [
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Village Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Old Houses\n(~60)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 118, w: 180, h: 70 },
                { label: 'Pub &\nPost Office', color: '#fde68a', textColor: '#78350f', x: 190, y: 118, w: 120, h: 70 },
                { label: 'Boat\nStorage', color: '#d1d5db', textColor: '#374151', x: 320, y: 118, w: 80, h: 70 },
                { label: 'Fishing\nHarbour', color: '#60a5fa', textColor: '#1e3a8a', x: 60, y: 198, w: 280, h: 42 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: '2020',
              elements: [
                { label: 'Holiday\nCottages (120)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Caravan\nPark', color: '#fef08a', textColor: '#713f12', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Village Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Old Houses\n(~60)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 118, w: 130, h: 70 },
                { label: 'Shops &\nRestaurants', color: '#ddd6fe', textColor: '#4c1d95', x: 140, y: 118, w: 130, h: 70 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 280, y: 118, w: 120, h: 70 },
                { label: 'Tourist\nMarina', color: '#06b6d4', textColor: '#fff', x: 60, y: 198, w: 280, h: 42 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Island of Palmera – Before and After Resort Development',
        instruction: 'The maps below show the island of Palmera before and after resort development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Tropical\nForest', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 120 },
                { label: 'Small\nVillage (30)', color: '#fdba74', textColor: '#7c2d12', x: 10, y: 130, w: 120, h: 70 },
                { label: 'Scrubland', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 130, w: 260, h: 70 },
                { label: 'Beach', color: '#fef08a', textColor: '#78350f', x: 0, y: 210, w: 400, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'Managed\nForest Reserve', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 195, h: 120 },
                { label: 'Golf\nCourse', color: '#86efac', textColor: '#166534', x: 205, y: 0, w: 195, h: 120 },
                { label: 'Original\nVillage', color: '#fdba74', textColor: '#7c2d12', x: 10, y: 130, w: 90, h: 70 },
                { label: 'Hotel\nComplex (5★)', color: '#06b6d4', textColor: '#fff', x: 110, y: 130, w: 150, h: 70 },
                { label: 'Villas &\nSpa', color: '#ddd6fe', textColor: '#4c1d95', x: 270, y: 130, w: 130, h: 70 },
                { label: 'Beach &\nWater Sports', color: '#fef08a', textColor: '#78350f', x: 0, y: 210, w: 280, h: 30 },
                { label: 'Marina', color: '#06b6d4', textColor: '#fff', x: 290, y: 210, w: 110, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Town of Riverside – Before and After Flood Defences',
        instruction: 'The maps below show the town of Riverside before and after a major flood defence scheme was constructed. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Flood Scheme',
              elements: [
                { label: 'Residential\nArea (N)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Town\nCentre', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Low-lying\nMeadow', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 118, w: 400, h: 60 },
                { label: 'River (undefended)', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 188, w: 400, h: 35 },
                { label: 'Flood Plain\n(at risk)', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 232, w: 400, h: 68 },
              ],
            },
            {
              label: 'After Flood Scheme',
              elements: [
                { label: 'Residential\nArea (N)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Town\nCentre', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Flood Storage\nBasin & Wetland', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 118, w: 400, h: 60 },
                { label: 'River (new\nflood wall)', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 188, w: 400, h: 35 },
                { label: 'Flood\nDefence Embankment', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 228, w: 400, h: 14 },
                { label: 'Riverside\nPark & Walkway', color: '#86efac', textColor: '#166534', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Village of Birchford – Before and After Bypass Road',
        instruction: 'The maps below show the village of Birchford before and after the construction of a bypass road. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Bypass',
              elements: [
                { label: 'Farmland (N)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 90 },
                { label: 'High Street\n(through traffic)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 14 },
                { label: 'Village\nHouses', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 112, w: 130, h: 80 },
                { label: 'Shops &\nPub', color: '#fde68a', textColor: '#78350f', x: 140, y: 112, w: 120, h: 80 },
                { label: 'Church', color: '#bfdbfe', textColor: '#1e3a8a', x: 270, y: 112, w: 130, h: 80 },
                { label: 'Farmland (S)', color: '#86efac', textColor: '#166534', x: 0, y: 202, w: 400, h: 98 },
              ],
            },
            {
              label: 'After Bypass',
              elements: [
                { label: 'Farmland (N)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 230, h: 90 },
                { label: 'New Bypass\nRoad (E–W)', color: '#6b7280', textColor: '#f9fafb', x: 230, y: 0, w: 170, h: 90 },
                { label: 'Bypass Road\n(northern arc)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 90, w: 400, h: 14 },
                { label: 'Village\nHouses', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 112, w: 130, h: 80 },
                { label: 'Shops &\nPub (quieter)', color: '#fde68a', textColor: '#78350f', x: 140, y: 112, w: 120, h: 80 },
                { label: 'Church', color: '#bfdbfe', textColor: '#1e3a8a', x: 270, y: 112, w: 130, h: 80 },
                { label: 'New Housing\n(80 homes)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 202, w: 195, h: 98 },
                { label: 'Farmland (S)', color: '#86efac', textColor: '#166534', x: 205, y: 202, w: 195, h: 98 },
              ],
            },
          ],
        },
      },
      {
        title: 'Industrial Estate to Mixed-Use Development',
        instruction: 'The maps below show an industrial estate before and after it was redeveloped into a mixed-use area. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Redevelopment',
              elements: [
                { label: 'Factory A', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 130, h: 100 },
                { label: 'Factory B', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 0, w: 130, h: 100 },
                { label: 'Factory C', color: '#9ca3af', textColor: '#1f2937', x: 280, y: 0, w: 120, h: 100 },
                { label: 'Access Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Warehouse\nComplex', color: '#d1d5db', textColor: '#374151', x: 0, y: 128, w: 260, h: 90 },
                { label: 'Car Park\n(HGV)', color: '#94a3b8', textColor: '#1e293b', x: 270, y: 128, w: 130, h: 90 },
                { label: 'Disused\nLand', color: '#e5e7eb', textColor: '#374151', x: 0, y: 226, w: 400, h: 74 },
              ],
            },
            {
              label: 'After Redevelopment',
              elements: [
                { label: 'Apartments\n(200 units)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 130, h: 100 },
                { label: 'Office\nBlock A', color: '#c4b5fd', textColor: '#5b21b6', x: 140, y: 0, w: 130, h: 100 },
                { label: 'Office\nBlock B', color: '#c4b5fd', textColor: '#5b21b6', x: 280, y: 0, w: 120, h: 100 },
                { label: 'Boulevard\n(tree-lined)', color: '#86efac', textColor: '#166534', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Retail &\nRestaurants', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 128, w: 195, h: 90 },
                { label: 'Community\nCentre', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 128, w: 195, h: 90 },
                { label: 'Urban\nPark & Water Feature', color: '#86efac', textColor: '#166534', x: 0, y: 226, w: 400, h: 74 },
              ],
            },
          ],
        },
      },
      {
        title: 'Airport Fringe Area (1990 vs 2022)',
        instruction: 'The maps below show the area surrounding a regional airport in 1990 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1990',
              elements: [
                { label: 'Airport\nTerminal', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Airport Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 80, w: 400, h: 12 },
                { label: 'Small Car\nPark', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 100, w: 180, h: 70 },
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 190, y: 100, w: 210, h: 70 },
                { label: 'Main Road\n(A-road)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 178, w: 400, h: 12 },
                { label: 'Rural\nVillage', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 198, w: 150, h: 90 },
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 160, y: 198, w: 240, h: 90 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Expanded\nTerminal + Runway', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Airport Road\n(dual carriageway)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 80, w: 400, h: 14 },
                { label: 'Multi-Storey\nCar Parks', color: '#64748b', textColor: '#f9fafb', x: 0, y: 102, w: 180, h: 70 },
                { label: 'Airport\nHotel', color: '#06b6d4', textColor: '#fff', x: 190, y: 102, w: 120, h: 70 },
                { label: 'Logistics\nHub', color: '#d1d5db', textColor: '#374151', x: 320, y: 102, w: 80, h: 70 },
                { label: 'Main Road\n(motorway link)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 180, w: 400, h: 14 },
                { label: 'Business\nPark', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 202, w: 195, h: 86 },
                { label: 'Retail\nOutlet Centre', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 202, w: 195, h: 86 },
              ],
            },
          ],
        },
      },
      {
        title: 'Sports Complex – Before and After Expansion',
        instruction: 'The maps below show a sports complex before and after expansion. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Expansion',
              elements: [
                { label: 'Car Park\n(entrance)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 45 },
                { label: 'Main\nStadium', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 55, w: 180, h: 110 },
                { label: 'Training\nPitches (x2)', color: '#4ade80', textColor: '#14532d', x: 190, y: 55, w: 210, h: 110 },
                { label: 'Leisure\nCentre', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 175, w: 180, h: 80 },
                { label: 'Tennis\nCourts (x4)', color: '#a7f3d0', textColor: '#065f46', x: 190, y: 175, w: 210, h: 80 },
                { label: 'Access Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 263, w: 400, h: 12 },
                { label: 'Unused\nLand', color: '#e5e7eb', textColor: '#374151', x: 0, y: 280, w: 400, h: 20 },
              ],
            },
            {
              label: 'After Expansion',
              elements: [
                { label: 'Expanded Car\nPark (600 spaces)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 45 },
                { label: 'Main Stadium\n(extended)', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 55, w: 180, h: 110 },
                { label: 'All-Weather\nPitches (x4)', color: '#4ade80', textColor: '#14532d', x: 190, y: 55, w: 210, h: 110 },
                { label: 'Leisure Centre\n+ Gym', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 175, w: 180, h: 80 },
                { label: 'Indoor Sports\nArena', color: '#6ee7b7', textColor: '#064e3b', x: 190, y: 175, w: 130, h: 80 },
                { label: 'Aquatic\nCentre', color: '#7dd3fc', textColor: '#0c4a6e', x: 330, y: 175, w: 70, h: 80 },
                { label: 'Access Road\n(widened)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 263, w: 400, h: 12 },
                { label: 'Athletes\nVillage', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 280, w: 400, h: 20 },
              ],
            },
          ],
        },
      },
      {
        title: 'Docklands of Portwick (1985 vs 2022)',
        instruction: 'The maps below show the docklands area of Portwick in 1985 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1985',
              elements: [
                { label: 'Warehouse\nDistrict', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 400, h: 90 },
                { label: 'Dock Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Dock 1\n(cargo)', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 110, w: 130, h: 80 },
                { label: 'Dock 2\n(cargo)', color: '#60a5fa', textColor: '#1e3a8a', x: 140, y: 110, w: 120, h: 80 },
                { label: 'Shipyard', color: '#9ca3af', textColor: '#1f2937', x: 270, y: 110, w: 130, h: 80 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Luxury\nApartments', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Office\nComplex', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Riverside\nBoulevard', color: '#86efac', textColor: '#166534', x: 0, y: 90, w: 400, h: 14 },
                { label: 'Marina\n(leisure boats)', color: '#06b6d4', textColor: '#fff', x: 0, y: 112, w: 195, h: 80 },
                { label: 'Restaurants\n& Cafés', color: '#fde68a', textColor: '#78350f', x: 205, y: 112, w: 195, h: 80 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
          ],
        },
      },
      {
        title: 'Rural District of Fernvale (1965 vs 2015)',
        instruction: 'The maps below show the rural district of Fernvale in 1965 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1965',
              elements: [
                { label: 'Woodland', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 180, h: 130 },
                { label: 'Mixed\nFarmland', color: '#86efac', textColor: '#166534', x: 190, y: 0, w: 210, h: 130 },
                { label: 'Country\nLane', color: '#d4d4d4', textColor: '#374151', x: 0, y: 130, w: 400, h: 10 },
                { label: 'Small\nFarmsteads (x4)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 148, w: 400, h: 60 },
                { label: 'River Fern', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 218, w: 400, h: 30 },
                { label: 'Water\nMeadows', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 256, w: 400, h: 44 },
              ],
            },
            {
              label: '2015',
              elements: [
                { label: 'Woodland\n(protected)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 180, h: 130 },
                { label: 'Solar Farm\n(64 ha)', color: '#fef08a', textColor: '#713f12', x: 190, y: 0, w: 210, h: 130 },
                { label: 'New Road\n(B-road)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 130, w: 400, h: 12 },
                { label: 'Village\nExpansion (200)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 150, w: 195, h: 60 },
                { label: 'Business\nUnits (light)', color: '#d1d5db', textColor: '#374151', x: 205, y: 150, w: 195, h: 60 },
                { label: 'River Fern', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 218, w: 400, h: 30 },
                { label: 'Nature\nReserve (SSSI)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 256, w: 400, h: 44 },
              ],
            },
          ],
        },
      },
      {
        title: 'Greenway General Hospital Campus (1990 vs 2022)',
        instruction: 'The maps below show the layout of Greenway General Hospital campus in 1990 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1990',
              elements: [
                { label: 'Main Hospital\nBuilding', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 0, w: 220, h: 100 },
                { label: 'Car Park\n(200 spaces)', color: '#94a3b8', textColor: '#1e293b', x: 230, y: 0, w: 170, h: 100 },
                { label: 'Internal Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Outpatient\nWing', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 118, w: 120, h: 80 },
                { label: 'Green\nSpace', color: '#86efac', textColor: '#166534', x: 130, y: 118, w: 145, h: 80 },
                { label: 'Nurses\nResidence', color: '#fdba74', textColor: '#7c2d12', x: 285, y: 118, w: 115, h: 80 },
                { label: 'Access Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 206, w: 400, h: 12 },
                { label: 'Grounds', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 226, w: 400, h: 74 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Main Hospital\n(extended)', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 0, w: 220, h: 100 },
                { label: 'Multi-Storey\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 230, y: 0, w: 170, h: 100 },
                { label: 'Internal Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Outpatient\n+ A&E', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 118, w: 120, h: 80 },
                { label: 'Cancer\nCentre (new)', color: '#f9a8d4', textColor: '#831843', x: 130, y: 118, w: 145, h: 80 },
                { label: 'Staff\nApartments', color: '#fdba74', textColor: '#7c2d12', x: 285, y: 118, w: 115, h: 80 },
                { label: 'Access Road\n(widened)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 206, w: 400, h: 12 },
                { label: 'Helipad &\nAmbulance Bay', color: '#d1d5db', textColor: '#374151', x: 0, y: 226, w: 195, h: 74 },
                { label: 'Therapy\nGardens', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 226, w: 195, h: 74 },
              ],
            },
          ],
        },
      },
      {
        title: 'Science Park of Eastmere (2000 vs 2022)',
        instruction: 'The maps below show the layout of Eastmere Science Park in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Gatehouse\n& Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Lab\nBuilding A', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 60, w: 120, h: 90 },
                { label: 'Lab\nBuilding B', color: '#6ee7b7', textColor: '#064e3b', x: 140, y: 60, w: 120, h: 90 },
                { label: 'Green\nSpace', color: '#86efac', textColor: '#166534', x: 280, y: 60, w: 120, h: 90 },
                { label: 'Undeveloped\nLand', color: '#e5e7eb', textColor: '#374151', x: 0, y: 158, w: 400, h: 142 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Gatehouse\n& Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Lab\nBuilding A', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 60, w: 120, h: 90 },
                { label: 'Lab\nBuilding B', color: '#6ee7b7', textColor: '#064e3b', x: 140, y: 60, w: 120, h: 90 },
                { label: 'Tech\nStart-up Hub', color: '#a5f3fc', textColor: '#164e63', x: 280, y: 60, w: 120, h: 90 },
                { label: 'Internal Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 158, w: 400, h: 10 },
                { label: 'Lab\nBuilding C', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 176, w: 120, h: 90 },
                { label: 'Conference\nCentre', color: '#c4b5fd', textColor: '#5b21b6', x: 140, y: 176, w: 120, h: 90 },
                { label: 'Biotech\nCampus (new)', color: '#6ee7b7', textColor: '#064e3b', x: 280, y: 176, w: 120, h: 90 },
                { label: 'Cycle Path\n& Landscaping', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 270, w: 400, h: 30 },
              ],
            },
          ],
        },
      },
      {
        title: 'Lakeside International School – Before and After Expansion',
        instruction: 'The maps below show Lakeside International School before and after a major expansion programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Expansion',
              elements: [
                { label: 'Car Park\n(entrance)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Main\nSchool Block', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 50, w: 180, h: 110 },
                { label: 'Sports\nHall', color: '#6ee7b7', textColor: '#064e3b', x: 190, y: 50, w: 210, h: 110 },
                { label: 'Playing\nFields', color: '#4ade80', textColor: '#14532d', x: 0, y: 168, w: 280, h: 132 },
                { label: 'Science\nBlock', color: '#93c5fd', textColor: '#1e3a8a', x: 290, y: 168, w: 110, h: 132 },
              ],
            },
            {
              label: 'After Expansion',
              elements: [
                { label: 'Extended\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Main\nSchool Block', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 50, w: 180, h: 110 },
                { label: 'Sports\nHall', color: '#6ee7b7', textColor: '#064e3b', x: 190, y: 50, w: 130, h: 110 },
                { label: 'Sixth Form\nCentre (new)', color: '#7dd3fc', textColor: '#0c4a6e', x: 330, y: 50, w: 70, h: 110 },
                { label: 'Playing\nFields', color: '#4ade80', textColor: '#14532d', x: 0, y: 168, w: 195, h: 132 },
                { label: 'Performing\nArts Centre', color: '#f9a8d4', textColor: '#831843', x: 205, y: 168, w: 80, h: 132 },
                { label: 'Science\nBlock (ext.)', color: '#93c5fd', textColor: '#1e3a8a', x: 295, y: 168, w: 105, h: 132 },
              ],
            },
          ],
        },
      },
      {
        title: 'Former Mining Town of Coalford – Before and After Regeneration',
        instruction: 'The maps below show the former mining town of Coalford before and after a regeneration programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Regeneration',
              elements: [
                { label: 'Colliery\n(closed)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 195, h: 110 },
                { label: 'Spoil\nHeap', color: '#6b7280', textColor: '#f9fafb', x: 205, y: 0, w: 195, h: 110 },
                { label: 'Main Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 110, w: 400, h: 12 },
                { label: 'Terraced\nHousing (300)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 130, w: 195, h: 90 },
                { label: 'Derelict\nShops & Pub', color: '#d1d5db', textColor: '#374151', x: 205, y: 130, w: 195, h: 90 },
                { label: 'Disused\nRailway Line', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Wasteland', color: '#e5e7eb', textColor: '#374151', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Regeneration',
              elements: [
                { label: 'Mining\nMuseum (heritage)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 195, h: 110 },
                { label: 'Country\nPark (reclaimed)', color: '#86efac', textColor: '#166534', x: 205, y: 0, w: 195, h: 110 },
                { label: 'Main Road\n(improved)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 110, w: 400, h: 12 },
                { label: 'Renovated\nHousing (300)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 130, w: 195, h: 90 },
                { label: 'New Retail\n& Community', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 130, w: 195, h: 90 },
                { label: 'Cycle &\nWalkway (former rail)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 228, w: 400, h: 12 },
                { label: 'New Housing\n(180 homes)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'City Waterfront of Brindock (1985 vs 2022)',
        instruction: 'The maps below show the city waterfront area of Brindock in 1985 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1985',
              elements: [
                { label: 'Industrial\nBuildings', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Dock Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Warehouses\n(working)', color: '#d1d5db', textColor: '#374151', x: 0, y: 120, w: 400, h: 80 },
                { label: 'Quayside\n(cargo cranes)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 208, w: 400, h: 32 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Residential\nTowers (400 units)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Hotel &\nConference Centre', color: '#06b6d4', textColor: '#fff', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Riverside\nBoulevard', color: '#86efac', textColor: '#166534', x: 0, y: 100, w: 400, h: 14 },
                { label: 'Arts Centre\n& Galleries', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 122, w: 130, h: 80 },
                { label: 'Cafés &\nRestaurants', color: '#fde68a', textColor: '#78350f', x: 140, y: 122, w: 130, h: 80 },
                { label: 'Amphitheatre\n& Events Space', color: '#a5f3fc', textColor: '#164e63', x: 280, y: 122, w: 120, h: 80 },
                { label: 'Promenade\n(pedestrian)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 210, w: 400, h: 30 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Town of Sandport – Before and After Coastal Development',
        instruction: 'The maps below show the coastal town of Sandport before and after a major development scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Agricultural\nLand', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 90 },
                { label: 'Coastal Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Old Town\nCentre', color: '#fdba74', textColor: '#7c2d12', x: 60, y: 110, w: 280, h: 80 },
                { label: 'Beach &\nDunes', color: '#fef08a', textColor: '#78350f', x: 0, y: 200, w: 400, h: 40 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'New Housing\n(320 homes)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Tourism &\nLeisure Zone', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Coastal Road\n(improved)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Old Town\nCentre', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 110, w: 130, h: 80 },
                { label: 'New Hotel\n& Conference', color: '#06b6d4', textColor: '#fff', x: 140, y: 110, w: 130, h: 80 },
                { label: 'Aquarium\n& Visitor Centre', color: '#7dd3fc', textColor: '#0c4a6e', x: 280, y: 110, w: 120, h: 80 },
                { label: 'Managed\nBeach & Promenade', color: '#fef08a', textColor: '#78350f', x: 0, y: 200, w: 400, h: 40 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Business Park of Northfield (2000 vs 2022)',
        instruction: 'The maps below show the layout of Northfield Business Park in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Entrance &\nSecurity', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Block A\n(offices)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 50, w: 120, h: 100 },
                { label: 'Block B\n(offices)', color: '#c4b5fd', textColor: '#5b21b6', x: 140, y: 50, w: 120, h: 100 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 280, y: 50, w: 120, h: 100 },
                { label: 'Undeveloped\nGreen Land', color: '#e5e7eb', textColor: '#374151', x: 0, y: 160, w: 400, h: 140 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Entrance &\nSecurity', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Block A\n(offices)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 50, w: 120, h: 100 },
                { label: 'Block B\n(offices)', color: '#c4b5fd', textColor: '#5b21b6', x: 140, y: 50, w: 120, h: 100 },
                { label: 'Block C\n(new offices)', color: '#a78bfa', textColor: '#4c1d95', x: 280, y: 50, w: 120, h: 100 },
                { label: 'Internal Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 158, w: 400, h: 10 },
                { label: 'Data\nCentre', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 176, w: 195, h: 80 },
                { label: 'Café &\nWellness Centre', color: '#fde68a', textColor: '#78350f', x: 205, y: 176, w: 195, h: 80 },
                { label: 'Cycle Paths\n& Green Space', color: '#86efac', textColor: '#166534', x: 0, y: 264, w: 400, h: 36 },
              ],
            },
          ],
        },
      },
      {
        title: 'Hillside Town of Moorfield (Before vs After Retail Park)',
        instruction: 'The maps below show the town of Moorfield before and after the construction of a retail park on the edge of town. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Retail Park',
              elements: [
                { label: 'Open\nMoorland', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Ring Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Town\nCentre', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 120, w: 195, h: 100 },
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 205, y: 120, w: 195, h: 100 },
                { label: 'Main Road\n(south)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Farmland\n(south)', color: '#86efac', textColor: '#166534', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Retail Park',
              elements: [
                { label: 'Retail Park\n(10 units)', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 0, w: 260, h: 100 },
                { label: 'Large\nSupermarket', color: '#c4b5fd', textColor: '#5b21b6', x: 270, y: 0, w: 130, h: 100 },
                { label: 'Ring Road\n(improved)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Town\nCentre', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 120, w: 195, h: 100 },
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 205, y: 120, w: 195, h: 100 },
                { label: 'Main Road\n(south)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'New Housing\n(150 homes)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Westbrook University Campus (1998 vs 2022)',
        instruction: 'The maps below show the layout of Westbrook University campus in 1998 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1998',
              elements: [
                { label: 'Car Park\n(entrance N)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 44 },
                { label: 'Arts\nFaculty', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 54, w: 120, h: 100 },
                { label: 'Science\nFaculty', color: '#6ee7b7', textColor: '#064e3b', x: 140, y: 54, w: 120, h: 100 },
                { label: 'Central\nLibrary', color: '#fca5a5', textColor: '#7f1d1d', x: 280, y: 54, w: 120, h: 100 },
                { label: 'Student\nUnion + Cafeteria', color: '#f9a8d4', textColor: '#831843', x: 0, y: 162, w: 180, h: 80 },
                { label: 'Playing\nFields', color: '#4ade80', textColor: '#14532d', x: 190, y: 162, w: 210, h: 80 },
                { label: 'Dormitories\n(600 beds)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 252, w: 400, h: 48 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Multi-Storey\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 0, y: 0, w: 195, h: 44 },
                { label: 'Bus &\nCycle Hub', color: '#86efac', textColor: '#166534', x: 205, y: 0, w: 195, h: 44 },
                { label: 'Arts\nFaculty', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 54, w: 120, h: 100 },
                { label: 'Science\nFaculty', color: '#6ee7b7', textColor: '#064e3b', x: 140, y: 54, w: 120, h: 100 },
                { label: 'Central Library\n+ IT Centre', color: '#fca5a5', textColor: '#7f1d1d', x: 280, y: 54, w: 120, h: 100 },
                { label: 'Student Union\n+ Cafeteria', color: '#f9a8d4', textColor: '#831843', x: 0, y: 162, w: 120, h: 80 },
                { label: 'Business\nSchool (new)', color: '#c4b5fd', textColor: '#5b21b6', x: 130, y: 162, w: 130, h: 80 },
                { label: 'Sports\nCentre (new)', color: '#6ee7b7', textColor: '#064e3b', x: 270, y: 162, w: 130, h: 80 },
                { label: 'Dormitories\n(1,400 beds)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 252, w: 400, h: 48 },
              ],
            },
          ],
        },
      },
      {
        title: 'Town Square Redevelopment – City of Northgate',
        instruction: 'The maps below show the town square area of Northgate city centre before and after a redevelopment project. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Redevelopment',
              elements: [
                { label: 'Old Office\nBuildings', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Multi-Storey\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Bus\nStation', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 120, w: 180, h: 70 },
                { label: 'Market\n(open-air)', color: '#fef08a', textColor: '#713f12', x: 190, y: 120, w: 210, h: 70 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 198, w: 400, h: 12 },
                { label: 'Derelict\nSite', color: '#e5e7eb', textColor: '#374151', x: 0, y: 218, w: 400, h: 82 },
              ],
            },
            {
              label: 'After Redevelopment',
              elements: [
                { label: 'Mixed-Use\nTower (apts + retail)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Public\nSquare & Fountain', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Pedestrian\nZone', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Transport\nInterchange', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 120, w: 180, h: 70 },
                { label: 'Indoor\nMarket (covered)', color: '#fef08a', textColor: '#713f12', x: 190, y: 120, w: 210, h: 70 },
                { label: 'Boulevard', color: '#86efac', textColor: '#166534', x: 0, y: 198, w: 400, h: 12 },
                { label: 'Cultural\nCentre & Library', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 218, w: 195, h: 82 },
                { label: 'Hotel &\nConference Centre', color: '#06b6d4', textColor: '#fff', x: 205, y: 218, w: 195, h: 82 },
              ],
            },
          ],
        },
      },
      {
        title: 'Residential Area of Oakpark – Before and After',
        instruction: 'The maps below show a residential area called Oakpark before and after a housing renewal scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Renewal',
              elements: [
                { label: 'Post-War\nFlats (8 blocks)', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Service\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Neglected\nParking Bays', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 118, w: 180, h: 70 },
                { label: 'Overgrown\nWaste Ground', color: '#e5e7eb', textColor: '#374151', x: 190, y: 118, w: 210, h: 70 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 196, w: 400, h: 12 },
                { label: 'Run-down\nShopping Parade', color: '#d1d5db', textColor: '#374151', x: 0, y: 216, w: 400, h: 84 },
              ],
            },
            {
              label: 'After Renewal',
              elements: [
                { label: 'New Family\nHomes (120)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Affordable\nApartments (80)', color: '#fdba74', textColor: '#7c2d12', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Shared\nGardens', color: '#86efac', textColor: '#166534', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Residents\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 118, w: 180, h: 70 },
                { label: 'Children\'s\nPlayground', color: '#bbf7d0', textColor: '#14532d', x: 190, y: 118, w: 210, h: 70 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 196, w: 400, h: 12 },
                { label: 'New\nLocal Shops (6)', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 216, w: 195, h: 84 },
                { label: 'Community\nHub & Café', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 216, w: 195, h: 84 },
              ],
            },
          ],
        },
      },
      {
        title: 'Old Quarry Site of Rockham – Before and After Conversion',
        instruction: 'The maps below show the Rockham quarry site before and after it was converted for community use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'During Quarry Operation',
              elements: [
                { label: 'Quarry\nOperations', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 140 },
                { label: 'Access Track', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 140, w: 400, h: 10 },
                { label: 'Stone\nCrushing Plant', color: '#d1d5db', textColor: '#374151', x: 0, y: 158, w: 180, h: 80 },
                { label: 'HGV\nParking', color: '#94a3b8', textColor: '#1e293b', x: 190, y: 158, w: 210, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 246, w: 400, h: 12 },
                { label: 'Wasteland', color: '#e5e7eb', textColor: '#374151', x: 0, y: 266, w: 400, h: 34 },
              ],
            },
            {
              label: 'After Conversion',
              elements: [
                { label: 'Flooded\nQuarry Lake (recreation)', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 0, w: 400, h: 140 },
                { label: 'Footpath\n& Cycle Trail', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 140, w: 400, h: 10 },
                { label: 'Visitor\nCentre & Café', color: '#fde68a', textColor: '#78350f', x: 0, y: 158, w: 180, h: 80 },
                { label: 'Car Park\n& Picnic Area', color: '#94a3b8', textColor: '#1e293b', x: 190, y: 158, w: 210, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 246, w: 400, h: 12 },
                { label: 'Wildflower\nMeadow', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 266, w: 400, h: 34 },
              ],
            },
          ],
        },
      },
      {
        title: 'Heritage Quarter of Oldtown – Before and After Conservation',
        instruction: 'The maps below show the Heritage Quarter of Oldtown before and after a conservation and restoration programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Conservation',
              elements: [
                { label: 'Historic\nGuild Hall (derelict)', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 130, h: 100 },
                { label: 'Car Park\n(surface)', color: '#94a3b8', textColor: '#1e293b', x: 140, y: 0, w: 130, h: 100 },
                { label: 'Victorian\nTerraces (poor state)', color: '#fdba74', textColor: '#7c2d12', x: 280, y: 0, w: 120, h: 100 },
                { label: 'Narrow\nOld Street', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 108, w: 400, h: 10 },
                { label: 'Former\nBrewing House', color: '#d1d5db', textColor: '#374151', x: 0, y: 126, w: 195, h: 90 },
                { label: 'Derelict\nYard', color: '#e5e7eb', textColor: '#374151', x: 205, y: 126, w: 195, h: 90 },
                { label: 'Canal', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 224, w: 400, h: 28 },
                { label: 'Overgrown\nTowpath', color: '#e5e7eb', textColor: '#374151', x: 0, y: 260, w: 400, h: 40 },
              ],
            },
            {
              label: 'After Conservation',
              elements: [
                { label: 'Restored\nGuild Hall (museum)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 130, h: 100 },
                { label: 'Pedestrian\nSquare', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 0, w: 130, h: 100 },
                { label: 'Renovated\nTerraces (B&B)', color: '#fdba74', textColor: '#7c2d12', x: 280, y: 0, w: 120, h: 100 },
                { label: 'Heritage\nStreet (no cars)', color: '#86efac', textColor: '#166534', x: 0, y: 108, w: 400, h: 10 },
                { label: 'Artisan\nShops & Gallery', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 126, w: 195, h: 90 },
                { label: 'Boutique\nHotel (restored)', color: '#06b6d4', textColor: '#fff', x: 205, y: 126, w: 195, h: 90 },
                { label: 'Canal\n(restored)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 224, w: 400, h: 28 },
                { label: 'Canal\nTowpath & Café Boat', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 260, w: 400, h: 40 },
              ],
            },
          ],
        },
      },
      {
        title: 'Prison Site of Irongate – Before and After Conversion',
        instruction: 'The maps below show the Irongate prison site before its closure and after conversion to a new use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Prison in Operation',
              elements: [
                { label: 'Perimeter\nWall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 14 },
                { label: 'Cell\nBlocks (A–D)', color: '#9ca3af', textColor: '#1f2937', x: 10, y: 22, w: 180, h: 130 },
                { label: 'Admin\nBuilding', color: '#d1d5db', textColor: '#374151', x: 200, y: 22, w: 110, h: 60 },
                { label: 'Exercise\nYard', color: '#e5e7eb', textColor: '#374151', x: 200, y: 92, w: 110, h: 60 },
                { label: 'Staff\nBlock', color: '#d1d5db', textColor: '#374151', x: 320, y: 22, w: 70, h: 130 },
                { label: 'Perimeter\nWall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 158, w: 400, h: 14 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 180, w: 400, h: 12 },
                { label: 'Car Park\n(staff)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
            {
              label: 'After Conversion',
              elements: [
                { label: 'Restored\nFaçade (listed)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 14 },
                { label: 'Apartments\n(100 units, former cells)', color: '#fdba74', textColor: '#7c2d12', x: 10, y: 22, w: 180, h: 130 },
                { label: 'Boutique\nHotel', color: '#06b6d4', textColor: '#fff', x: 200, y: 22, w: 110, h: 60 },
                { label: 'Courtyard\nGarden', color: '#86efac', textColor: '#166534', x: 200, y: 92, w: 110, h: 60 },
                { label: 'Gym &\nSpa', color: '#6ee7b7', textColor: '#064e3b', x: 320, y: 22, w: 70, h: 130 },
                { label: 'Landscape\nStrip', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 158, w: 400, h: 14 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 180, w: 400, h: 12 },
                { label: 'Public\nPark & Play Area', color: '#86efac', textColor: '#166534', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
          ],
        },
      },
      {
        title: 'Meadowbrook Nature Reserve – Before and After Management',
        instruction: 'The maps below show the Meadowbrook Nature Reserve before and after a conservation management plan was implemented. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Management',
              elements: [
                { label: 'Dense\nScrubland', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Overgrown\nFen', color: '#86efac', textColor: '#166534', x: 0, y: 108, w: 195, h: 90 },
                { label: 'Disused\nDrain', color: '#7dd3fc', textColor: '#0c4a6e', x: 205, y: 108, w: 195, h: 90 },
                { label: 'Unmanaged\nGrassland', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 206, w: 400, h: 80 },
                { label: 'Main Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 290, w: 400, h: 10 },
              ],
            },
            {
              label: 'After Management',
              elements: [
                { label: 'Coppiced\nWoodland', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Bird Hide\n& Viewing Platform', color: '#fde68a', textColor: '#78350f', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Restored\nReedbed Fen', color: '#86efac', textColor: '#166534', x: 0, y: 108, w: 195, h: 90 },
                { label: 'Restored\nPonds (x3)', color: '#7dd3fc', textColor: '#0c4a6e', x: 205, y: 108, w: 195, h: 90 },
                { label: 'Wildflower\nMeadow (managed)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 206, w: 195, h: 80 },
                { label: 'Visitor\nCentre & Toilets', color: '#fde68a', textColor: '#78350f', x: 205, y: 206, w: 195, h: 80 },
                { label: 'Main Road\n(car park added)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 290, w: 400, h: 10 },
              ],
            },
          ],
        },
      },
      {
        title: 'City Central Park – Before and After Renovation',
        instruction: 'The maps below show a city central park before and after a major renovation project. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Renovation',
              elements: [
                { label: 'Old\nBandstand (disused)', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 120, h: 80 },
                { label: 'Overgrown\nLawn', color: '#86efac', textColor: '#166534', x: 130, y: 0, w: 140, h: 80 },
                { label: 'Tennis\nCourts (unused)', color: '#a7f3d0', textColor: '#065f46', x: 280, y: 0, w: 120, h: 80 },
                { label: 'Path (poor\ncondition)', color: '#d4d4d4', textColor: '#374151', x: 0, y: 88, w: 400, h: 10 },
                { label: 'Run-down\nCafé', color: '#d1d5db', textColor: '#374151', x: 0, y: 106, w: 120, h: 80 },
                { label: 'Boating\nLake (neglected)', color: '#bae6fd', textColor: '#0c4a6e', x: 130, y: 106, w: 270, h: 80 },
                { label: 'Paths', color: '#d4d4d4', textColor: '#374151', x: 0, y: 194, w: 400, h: 10 },
                { label: 'Scrubby\nGarden Beds', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 212, w: 400, h: 88 },
              ],
            },
            {
              label: 'After Renovation',
              elements: [
                { label: 'Restored\nBandstand (events)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 120, h: 80 },
                { label: 'New\nPlayground', color: '#bbf7d0', textColor: '#14532d', x: 130, y: 0, w: 140, h: 80 },
                { label: 'Skate Park\n& BMX Area', color: '#94a3b8', textColor: '#1e293b', x: 280, y: 0, w: 120, h: 80 },
                { label: 'Landscaped\nPath', color: '#86efac', textColor: '#166534', x: 0, y: 88, w: 400, h: 10 },
                { label: 'New Café\n& Toilets', color: '#fde68a', textColor: '#78350f', x: 0, y: 106, w: 120, h: 80 },
                { label: 'Boating Lake\n(restored)', color: '#bae6fd', textColor: '#0c4a6e', x: 130, y: 106, w: 270, h: 80 },
                { label: 'Paved Path\n& Seating', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 194, w: 400, h: 10 },
                { label: 'Community\nGarden', color: '#86efac', textColor: '#166534', x: 0, y: 212, w: 195, h: 88 },
                { label: 'Sensory\nGarden', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 212, w: 195, h: 88 },
              ],
            },
          ],
        },
      },
      {
        title: 'Transport Hub Area of Stationbury – Before and After',
        instruction: 'The maps below show the area around Stationbury\'s main transport hub before and after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Rail Station\n(old)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Station Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 60, w: 400, h: 12 },
                { label: 'Surface\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 80, w: 195, h: 90 },
                { label: 'Vacant\nLots & Old Shops', color: '#e5e7eb', textColor: '#374151', x: 205, y: 80, w: 195, h: 90 },
                { label: 'Residential\nStreets', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 178, w: 400, h: 122 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'Modernised\nStation & Concourse', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Station\nBoulevard', color: '#86efac', textColor: '#166534', x: 0, y: 60, w: 400, h: 12 },
                { label: 'Multi-Storey\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 0, y: 80, w: 130, h: 90 },
                { label: 'Bus &\nTram Interchange', color: '#06b6d4', textColor: '#fff', x: 140, y: 80, w: 130, h: 90 },
                { label: 'Mixed-Use\nTower', color: '#c4b5fd', textColor: '#5b21b6', x: 280, y: 80, w: 120, h: 90 },
                { label: 'Transit-Oriented\nHousing (180 units)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 178, w: 195, h: 122 },
                { label: 'Retail &\nOffices (ground level)', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 178, w: 195, h: 122 },
              ],
            },
          ],
        },
      },
      {
        title: 'Lakeside Resort of Clearwater – Before and After',
        instruction: 'The maps below show the Clearwater lakeside area before and after a leisure resort was developed. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Resort',
              elements: [
                { label: 'Forest', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Rough\nTrack', color: '#d4d4d4', textColor: '#374151', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Wetland', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Lakeside\nReed Beds', color: '#86efac', textColor: '#166534', x: 0, y: 206, w: 400, h: 30 },
                { label: 'Lake Clearwater', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 244, w: 400, h: 56 },
              ],
            },
            {
              label: 'After Resort',
              elements: [
                { label: 'Retained\nForest (walks)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 195, h: 100 },
                { label: 'Eco-Lodge\nCabins (20)', color: '#fde68a', textColor: '#78350f', x: 205, y: 0, w: 195, h: 100 },
                { label: 'Resort\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 10 },
                { label: 'Activity\nCentre & Café', color: '#fde68a', textColor: '#78350f', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Holiday\nChalets (30)', color: '#fed7aa', textColor: '#9a3412', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Beach &\nJetty', color: '#fef08a', textColor: '#713f12', x: 0, y: 206, w: 260, h: 30 },
                { label: 'Marina &\nWatersports', color: '#06b6d4', textColor: '#fff', x: 270, y: 206, w: 130, h: 30 },
                { label: 'Lake Clearwater', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 244, w: 400, h: 56 },
              ],
            },
          ],
        },
      },
      {
        title: 'City Zoo of Greenham – Before and After Expansion',
        instruction: 'The maps below show the layout of Greenham City Zoo before and after an expansion programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Expansion',
              elements: [
                { label: 'Entrance\n& Ticket Office', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'African\nSavanna Enclosure', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 50, w: 195, h: 100 },
                { label: 'Reptile\nHouse', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 50, w: 195, h: 100 },
                { label: 'Café &\nGift Shop', color: '#fde68a', textColor: '#78350f', x: 0, y: 158, w: 130, h: 80 },
                { label: 'Children\'s\nFarm', color: '#86efac', textColor: '#166534', x: 140, y: 158, w: 130, h: 80 },
                { label: 'Unused\nLand', color: '#e5e7eb', textColor: '#374151', x: 280, y: 158, w: 120, h: 80 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 246, w: 400, h: 54 },
              ],
            },
            {
              label: 'After Expansion',
              elements: [
                { label: 'Entrance &\nTicket Office', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'African\nSavanna Enclosure', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 50, w: 195, h: 100 },
                { label: 'Reptile\nHouse', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 50, w: 195, h: 100 },
                { label: 'Café &\nGift Shop', color: '#fde68a', textColor: '#78350f', x: 0, y: 158, w: 130, h: 80 },
                { label: 'Children\'s\nFarm', color: '#86efac', textColor: '#166534', x: 140, y: 158, w: 130, h: 80 },
                { label: 'New Penguin\n& Arctic Zone', color: '#bae6fd', textColor: '#0c4a6e', x: 280, y: 158, w: 120, h: 80 },
                { label: 'Extended Car\nPark (600 spaces)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 246, w: 260, h: 54 },
                { label: 'New Education\nCentre', color: '#93c5fd', textColor: '#1e3a8a', x: 270, y: 246, w: 130, h: 54 },
              ],
            },
          ],
        },
      },
      {
        title: 'Former Airfield of Windmere – Before and After Development',
        instruction: 'The maps below show the former Windmere airfield before and after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Former Airfield',
              elements: [
                { label: 'Runway (E–W)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 30 },
                { label: 'Runway (N–S)', color: '#9ca3af', textColor: '#1f2937', x: 180, y: 0, w: 40, h: 300 },
                { label: 'Control\nTower', color: '#d1d5db', textColor: '#374151', x: 0, y: 40, w: 80, h: 70 },
                { label: 'Hangar\nA & B', color: '#d1d5db', textColor: '#374151', x: 0, y: 120, w: 170, h: 80 },
                { label: 'Perimeter\nGrass', color: '#86efac', textColor: '#166534', x: 230, y: 40, w: 170, h: 160 },
                { label: 'Perimeter\nGrass', color: '#86efac', textColor: '#166534', x: 0, y: 210, w: 170, h: 90 },
                { label: 'Perimeter\nGrass', color: '#86efac', textColor: '#166534', x: 230, y: 210, w: 170, h: 90 },
              ],
            },
            {
              label: 'After Redevelopment',
              elements: [
                { label: 'New\nHousing (500)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 170, h: 140 },
                { label: 'Central\nPark & Allotments', color: '#86efac', textColor: '#166534', x: 180, y: 0, w: 220, h: 140 },
                { label: 'Boulevard\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 148, w: 400, h: 12 },
                { label: 'Primary\nSchool', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 168, w: 130, h: 90 },
                { label: 'Community\nCentre', color: '#a5f3fc', textColor: '#164e63', x: 140, y: 168, w: 120, h: 90 },
                { label: 'Retail\nUnits', color: '#ddd6fe', textColor: '#4c1d95', x: 270, y: 168, w: 130, h: 90 },
                { label: 'Access Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 266, w: 400, h: 12 },
                { label: 'Buffer\nGreen Strip', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
          ],
        },
      },
      {
        title: 'Harbour Area of Crestport (2000 vs 2022)',
        instruction: 'The maps below show the harbour area of Crestport in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Fish\nProcessing Plant', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Cold\nStorage Facility', color: '#d1d5db', textColor: '#374151', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Harbour\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Working\nFishing Harbour', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 110, w: 400, h: 80 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Seafood\nRestaurant & Market', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Boutique\nHotel', color: '#06b6d4', textColor: '#fff', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Coastal\nPromenade', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Leisure\nMarina', color: '#06b6d4', textColor: '#fff', x: 0, y: 110, w: 195, h: 80 },
                { label: 'Heritage\nFishing Area', color: '#60a5fa', textColor: '#1e3a8a', x: 205, y: 110, w: 195, h: 80 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 200, w: 400, h: 100 },
              ],
            },
          ],
        },
      },
      {
        title: 'Botanical Gardens of Flowerdale – Before and After',
        instruction: 'The maps below show the Flowerdale Botanical Gardens before and after an improvement project. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Improvement',
              elements: [
                { label: 'Entrance\n& Ticket Hut', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Rose\nGarden', color: '#f9a8d4', textColor: '#831843', x: 0, y: 50, w: 120, h: 100 },
                { label: 'Tropical\nGlasshouse', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 50, w: 120, h: 100 },
                { label: 'Lawn\n(overgrown)', color: '#86efac', textColor: '#166534', x: 280, y: 50, w: 120, h: 100 },
                { label: 'Path', color: '#d4d4d4', textColor: '#374151', x: 0, y: 158, w: 400, h: 8 },
                { label: 'Kitchen\nGarden', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 174, w: 195, h: 90 },
                { label: 'Unused\nWalled Garden', color: '#e5e7eb', textColor: '#374151', x: 205, y: 174, w: 195, h: 90 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 272, w: 400, h: 28 },
              ],
            },
            {
              label: 'After Improvement',
              elements: [
                { label: 'New Visitor\nCentre & Shop', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Rose\nGarden', color: '#f9a8d4', textColor: '#831843', x: 0, y: 50, w: 120, h: 100 },
                { label: 'Extended\nGlasshouse', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 50, w: 120, h: 100 },
                { label: 'Japanese\nGarden (new)', color: '#86efac', textColor: '#166534', x: 280, y: 50, w: 120, h: 100 },
                { label: 'Paved\nPath (wide)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 158, w: 400, h: 8 },
                { label: 'Kitchen\nGarden', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 174, w: 195, h: 90 },
                { label: 'Heritage\nWalled Garden (restored)', color: '#fde68a', textColor: '#78350f', x: 205, y: 174, w: 195, h: 90 },
                { label: 'Car Park\n(expanded)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 272, w: 400, h: 28 },
              ],
            },
          ],
        },
      },
      {
        title: 'Riverside Leisure Area of Millhaven – Before and After',
        instruction: 'The maps below show the riverside leisure area of Millhaven before and after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Redevelopment',
              elements: [
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Main Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Derelict\nFactory Site', color: '#d1d5db', textColor: '#374151', x: 0, y: 120, w: 260, h: 80 },
                { label: 'Car Park\n(surface)', color: '#94a3b8', textColor: '#1e293b', x: 270, y: 120, w: 130, h: 80 },
                { label: 'River\nMillhaven', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 210, w: 400, h: 40 },
                { label: 'Inaccessible\nRiverbank', color: '#e5e7eb', textColor: '#374151', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
            {
              label: 'After Redevelopment',
              elements: [
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 100 },
                { label: 'Main Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 100, w: 400, h: 12 },
                { label: 'Riverside\nPark & Sculpture Trail', color: '#86efac', textColor: '#166534', x: 0, y: 120, w: 195, h: 80 },
                { label: 'Café &\nEvents Space', color: '#fde68a', textColor: '#78350f', x: 205, y: 120, w: 195, h: 80 },
                { label: 'River\nMillhaven', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 210, w: 400, h: 40 },
                { label: 'Riverside\nPromenade & Cycle Path', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
          ],
        },
      },
      {
        title: 'Stadium District – Before and After Development',
        instruction: 'The maps below show an area surrounding a new sports stadium before and after the surrounding district was developed. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Stadium',
              elements: [
                { label: 'Wasteland\n& Former Sidings', color: '#e5e7eb', textColor: '#374151', x: 0, y: 0, w: 400, h: 140 },
                { label: 'Railway\nLine', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 148, w: 400, h: 12 },
                { label: 'Industrial\nUnit', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 168, w: 195, h: 80 },
                { label: 'Vacant\nLand', color: '#e5e7eb', textColor: '#374151', x: 205, y: 168, w: 195, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 256, w: 400, h: 12 },
                { label: 'Housing', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'New\nStadium (40,000)', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 0, w: 250, h: 140 },
                { label: 'Fan\nZone & Plaza', color: '#a5f3fc', textColor: '#164e63', x: 260, y: 0, w: 140, h: 140 },
                { label: 'Railway\nLine + New Station', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 148, w: 400, h: 12 },
                { label: 'Hotel &\nConference', color: '#06b6d4', textColor: '#fff', x: 0, y: 168, w: 195, h: 80 },
                { label: 'Retail\n& Restaurants', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 168, w: 195, h: 80 },
                { label: 'Road\n(widened)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 256, w: 400, h: 12 },
                { label: 'Housing', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
          ],
        },
      },
      {
        title: 'Canal District of Lockley (1990 vs 2022)',
        instruction: 'The maps below show the canal district of Lockley in 1990 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1990',
              elements: [
                { label: 'Terraced\nHousing (200)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Street', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 80, w: 400, h: 10 },
                { label: 'Disused\nWharves', color: '#d1d5db', textColor: '#374151', x: 0, y: 98, w: 195, h: 70 },
                { label: 'Neglected\nWarehouses', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 98, w: 195, h: 70 },
                { label: 'Canal\n(unused)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 176, w: 400, h: 30 },
                { label: 'Overgrown\nTowpath', color: '#e5e7eb', textColor: '#374151', x: 0, y: 214, w: 400, h: 50 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 272, w: 400, h: 12 },
                { label: 'Wasteland', color: '#e5e7eb', textColor: '#374151', x: 0, y: 288, w: 400, h: 12 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Renovated\nTerraces + New Builds', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Street\n(pedestrianised)', color: '#86efac', textColor: '#166534', x: 0, y: 80, w: 400, h: 10 },
                { label: 'Canal-Side\nApartments', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 98, w: 195, h: 70 },
                { label: 'Artisan\nShops & Galleries', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 98, w: 195, h: 70 },
                { label: 'Canal\n(restored, boats)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 176, w: 400, h: 30 },
                { label: 'Towpath\nCafés & Cycle Route', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 214, w: 400, h: 50 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 272, w: 400, h: 12 },
                { label: 'New\nPublic Square', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 288, w: 400, h: 12 },
              ],
            },
          ],
        },
      },
      {
        title: 'Holiday Island of Sunbreak – Before and After',
        instruction: 'The maps below show the island of Sunbreak before and after tourism development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Tourism',
              elements: [
                { label: 'Pine\nForest', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 400, h: 110 },
                { label: 'Dirt\nTrack', color: '#d4d4d4', textColor: '#374151', x: 0, y: 110, w: 400, h: 8 },
                { label: 'Fishing\nVillage', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 126, w: 130, h: 80 },
                { label: 'Scrubland', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 126, w: 260, h: 80 },
                { label: 'Sandy\nBeach', color: '#fef08a', textColor: '#78350f', x: 0, y: 216, w: 400, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 254, w: 400, h: 46 },
              ],
            },
            {
              label: 'After Tourism',
              elements: [
                { label: 'Managed\nForest Reserve', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 195, h: 110 },
                { label: 'Golf\nCourse', color: '#4ade80', textColor: '#14532d', x: 205, y: 0, w: 195, h: 110 },
                { label: 'Island\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 110, w: 400, h: 10 },
                { label: 'Old Village\n(heritage area)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 128, w: 130, h: 80 },
                { label: 'Beach\nHotel (4★)', color: '#06b6d4', textColor: '#fff', x: 140, y: 128, w: 130, h: 80 },
                { label: 'Villas\n& Pool Complex', color: '#ddd6fe', textColor: '#4c1d95', x: 280, y: 128, w: 120, h: 80 },
                { label: 'Developed\nBeachfront', color: '#fef08a', textColor: '#78350f', x: 0, y: 216, w: 260, h: 30 },
                { label: 'Water\nSports Centre', color: '#06b6d4', textColor: '#fff', x: 270, y: 216, w: 130, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 254, w: 400, h: 46 },
              ],
            },
          ],
        },
      },
      {
        title: 'Eco Village of Greenfield – Before and After',
        instruction: 'The maps below show the area of Greenfield before and after an eco-village was established. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Eco-Village',
              elements: [
                { label: 'Mixed\nFarmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 130 },
                { label: 'Farm\nTrack', color: '#d4d4d4', textColor: '#374151', x: 0, y: 130, w: 400, h: 8 },
                { label: 'Old\nFarm Buildings', color: '#d1d5db', textColor: '#374151', x: 0, y: 146, w: 160, h: 90 },
                { label: 'Paddocks', color: '#a7f3d0', textColor: '#065f46', x: 170, y: 146, w: 230, h: 90 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 244, w: 400, h: 12 },
                { label: 'Hedgerows', color: '#86efac', textColor: '#166534', x: 0, y: 264, w: 400, h: 36 },
              ],
            },
            {
              label: 'After Eco-Village',
              elements: [
                { label: 'Community\nOrchard & Allotments', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 195, h: 130 },
                { label: 'Solar\nPanels Array', color: '#fef08a', textColor: '#713f12', x: 205, y: 0, w: 195, h: 130 },
                { label: 'Eco\nPath', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 130, w: 400, h: 8 },
                { label: 'Eco-Homes\n(straw-bale, 40)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 146, w: 195, h: 90 },
                { label: 'Community\nHub & Composting', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 146, w: 195, h: 90 },
                { label: 'Road\n(car-free access)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 244, w: 400, h: 12 },
                { label: 'Wildflower\nMeadow & Beehives', color: '#fef08a', textColor: '#713f12', x: 0, y: 264, w: 400, h: 36 },
              ],
            },
          ],
        },
      },
      {
        title: 'Brownfield Site Regeneration – Eastside',
        instruction: 'The maps below show a brownfield site in the Eastside district before and after regeneration. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Regeneration',
              elements: [
                { label: 'Derelict\nWorks & Sidings', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 120 },
                { label: 'Old Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 120, w: 400, h: 12 },
                { label: 'Contaminated\nLand', color: '#e5e7eb', textColor: '#374151', x: 0, y: 140, w: 260, h: 90 },
                { label: 'Old Lock-up\nGarages', color: '#d1d5db', textColor: '#374151', x: 270, y: 140, w: 130, h: 90 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 238, w: 400, h: 12 },
                { label: 'Existing\nResidential', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
            {
              label: 'After Regeneration',
              elements: [
                { label: 'Affordable\nHousing (200 units)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 120 },
                { label: 'Mixed-Use\nBlock (retail + flats)', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 120 },
                { label: 'New\nHigh Street', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 120, w: 400, h: 12 },
                { label: 'Urban\nPark (decontaminated)', color: '#86efac', textColor: '#166534', x: 0, y: 140, w: 195, h: 90 },
                { label: 'Medical\nCentre', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 140, w: 195, h: 90 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 238, w: 400, h: 12 },
                { label: 'Existing\nResidential', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
          ],
        },
      },
      {
        title: 'Valley Settlement of Deepwater (1960 vs 2010)',
        instruction: 'The maps below show the valley settlement of Deepwater in 1960 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1960',
              elements: [
                { label: 'Woodland\n(valley sides)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 130, h: 300 },
                { label: 'Woodland\n(valley sides)', color: '#a7f3d0', textColor: '#065f46', x: 280, y: 0, w: 120, h: 300 },
                { label: 'Hay\nMeadows', color: '#86efac', textColor: '#166534', x: 140, y: 0, w: 130, h: 90 },
                { label: 'Village\n(~40 houses)', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 100, w: 130, h: 80 },
                { label: 'River\nDeepwater', color: '#7dd3fc', textColor: '#0c4a6e', x: 140, y: 192, w: 130, h: 28 },
                { label: 'Water\nMill', color: '#fde68a', textColor: '#78350f', x: 140, y: 228, w: 130, h: 60 },
              ],
            },
            {
              label: '2010',
              elements: [
                { label: 'Protected\nWoodland (AONB)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 0, w: 130, h: 300 },
                { label: 'Protected\nWoodland (AONB)', color: '#a7f3d0', textColor: '#065f46', x: 280, y: 0, w: 120, h: 300 },
                { label: 'New\nHousing (80)', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 0, w: 130, h: 90 },
                { label: 'Village\nCentre', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 100, w: 130, h: 80 },
                { label: 'River\nDeepwater', color: '#7dd3fc', textColor: '#0c4a6e', x: 140, y: 192, w: 130, h: 28 },
                { label: 'Restored\nMill (B&B)', color: '#fde68a', textColor: '#78350f', x: 140, y: 228, w: 130, h: 60 },
              ],
            },
          ],
        },
      },
      {
        title: 'Country Estate of Fernwood – Before and After Opening to Public',
        instruction: 'The maps below show the Fernwood country estate before and after it was opened to the public as a visitor attraction. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Private Estate',
              elements: [
                { label: 'Fernwood\nManor (house)', color: '#fde68a', textColor: '#78350f', x: 140, y: 0, w: 120, h: 80 },
                { label: 'Formal\nGardens', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 0, w: 130, h: 150 },
                { label: 'Parkland\n(private)', color: '#86efac', textColor: '#166534', x: 270, y: 0, w: 130, h: 150 },
                { label: 'Walled\nKitchen Garden', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 90, w: 120, h: 60 },
                { label: 'Stable\nBlock', color: '#d1d5db', textColor: '#374151', x: 140, y: 160, w: 120, h: 60 },
                { label: 'Woodland\nWalks (private)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 160, w: 130, h: 140 },
                { label: 'Lake', color: '#bae6fd', textColor: '#0c4a6e', x: 270, y: 160, w: 130, h: 140 },
                { label: 'Estate\nRoad (gated)', color: '#d4d4d4', textColor: '#374151', x: 140, y: 230, w: 120, h: 70 },
              ],
            },
            {
              label: 'Open to Public',
              elements: [
                { label: 'Fernwood\nManor (tours)', color: '#fde68a', textColor: '#78350f', x: 140, y: 0, w: 120, h: 80 },
                { label: 'Formal\nGardens', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 0, w: 130, h: 150 },
                { label: 'Parkland\n(public access)', color: '#86efac', textColor: '#166534', x: 270, y: 0, w: 130, h: 150 },
                { label: 'Visitor\nCentre & Café', color: '#fde68a', textColor: '#78350f', x: 140, y: 90, w: 120, h: 60 },
                { label: 'Gift Shop\n& Events Barn', color: '#ddd6fe', textColor: '#4c1d95', x: 140, y: 160, w: 120, h: 60 },
                { label: 'Nature\nTrails (marked)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 160, w: 130, h: 140 },
                { label: 'Boating\nLake (public)', color: '#bae6fd', textColor: '#0c4a6e', x: 270, y: 160, w: 130, h: 140 },
                { label: 'Car Park\n(600 spaces)', color: '#94a3b8', textColor: '#1e293b', x: 140, y: 230, w: 120, h: 70 },
              ],
            },
          ],
        },
      },
      {
        title: 'Town of Castleton – Before and After Pedestrianisation',
        instruction: 'The maps below show the historic town centre of Castleton before and after a pedestrianisation scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Pedestrianisation',
              elements: [
                { label: 'Through\nTraffic (N–S)', color: '#9ca3af', textColor: '#1f2937', x: 180, y: 0, w: 40, h: 300 },
                { label: 'Old\nMarket Building', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 170, h: 100 },
                { label: 'Shops\n(terraced)', color: '#ddd6fe', textColor: '#4c1d95', x: 230, y: 0, w: 170, h: 100 },
                { label: 'Through\nTraffic (E–W)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Church &\nChurchyard', color: '#bfdbfe', textColor: '#1e3a8a', x: 0, y: 128, w: 170, h: 100 },
                { label: 'Town\nHall', color: '#fde68a', textColor: '#78350f', x: 230, y: 128, w: 170, h: 100 },
                { label: 'Road\n(south)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 236, w: 400, h: 10 },
                { label: 'Car\nParks', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 254, w: 400, h: 46 },
              ],
            },
            {
              label: 'After Pedestrianisation',
              elements: [
                { label: 'Pedestrian\nZone (paved)', color: '#bbf7d0', textColor: '#14532d', x: 180, y: 0, w: 40, h: 300 },
                { label: 'Old Market\nBuilding (restored)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 170, h: 100 },
                { label: 'Shops\n& Outdoor Café Area', color: '#ddd6fe', textColor: '#4c1d95', x: 230, y: 0, w: 170, h: 100 },
                { label: 'Market\nSquare (open-air)', color: '#fef08a', textColor: '#713f12', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Church &\nChurchyard', color: '#bfdbfe', textColor: '#1e3a8a', x: 0, y: 128, w: 170, h: 100 },
                { label: 'Town Hall\n(events venue)', color: '#fde68a', textColor: '#78350f', x: 230, y: 128, w: 170, h: 100 },
                { label: 'Ring Road\n(diverted traffic)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 236, w: 400, h: 10 },
                { label: 'Multi-Storey\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 0, y: 254, w: 400, h: 46 },
              ],
            },
          ],
        },
      },
      {
        title: 'Power Station Area of Ironvale – Before and After',
        instruction: 'The maps below show the area surrounding the Ironvale power station before and after the station was decommissioned and the land was redeveloped. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'During Power Station Operation',
              elements: [
                { label: 'Power\nStation (active)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 260, h: 130 },
                { label: 'Cooling\nTowers', color: '#6b7280', textColor: '#f9fafb', x: 270, y: 0, w: 130, h: 130 },
                { label: 'Access Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 130, w: 400, h: 12 },
                { label: 'Coal\nStorage Yard', color: '#64748b', textColor: '#f9fafb', x: 0, y: 150, w: 195, h: 90 },
                { label: 'Substation\n& Grid', color: '#d1d5db', textColor: '#374151', x: 205, y: 150, w: 195, h: 90 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Redevelopment',
              elements: [
                { label: 'Technology\nPark (new)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 0, w: 260, h: 130 },
                { label: 'Retained\nChimney (landmark)', color: '#d1d5db', textColor: '#374151', x: 270, y: 0, w: 130, h: 130 },
                { label: 'Boulevard', color: '#86efac', textColor: '#166534', x: 0, y: 130, w: 400, h: 12 },
                { label: 'Residential\nDevelopment (300)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 150, w: 195, h: 90 },
                { label: 'Riverside\nPark', color: '#86efac', textColor: '#166534', x: 205, y: 150, w: 195, h: 90 },
                { label: 'River', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Peninsula Resort of Rockpoint – Before and After',
        instruction: 'The maps below show the Rockpoint peninsula before and after resort development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 0, w: 100, h: 300 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 300, y: 0, w: 100, h: 300 },
                { label: 'Rough\nGrassland', color: '#a7f3d0', textColor: '#065f46', x: 110, y: 0, w: 180, h: 100 },
                { label: 'Rocky\nCliff', color: '#9ca3af', textColor: '#1f2937', x: 110, y: 108, w: 180, h: 80 },
                { label: 'Shingle\nBeach', color: '#fef08a', textColor: '#78350f', x: 110, y: 196, w: 180, h: 60 },
                { label: 'Sea\n(south)', color: '#bae6fd', textColor: '#0c4a6e', x: 110, y: 264, w: 180, h: 36 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 0, w: 100, h: 300 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 300, y: 0, w: 100, h: 300 },
                { label: 'Cliff-Top\nHotel', color: '#06b6d4', textColor: '#fff', x: 110, y: 0, w: 180, h: 100 },
                { label: 'Cliff Walk\n& Viewpoints', color: '#bbf7d0', textColor: '#14532d', x: 110, y: 108, w: 180, h: 80 },
                { label: 'Beach Huts\n& Café', color: '#fef08a', textColor: '#78350f', x: 110, y: 196, w: 180, h: 60 },
                { label: 'Sea\n(south)', color: '#bae6fd', textColor: '#0c4a6e', x: 110, y: 264, w: 180, h: 36 },
              ],
            },
          ],
        },
      },
      {
        title: 'Technology District of Millfield (2000 vs 2022)',
        instruction: 'The maps below show the technology district of Millfield in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Entrance\nGatehouse', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Tech\nCompany A', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 50, w: 195, h: 90 },
                { label: 'Tech\nCompany B', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 50, w: 195, h: 90 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 148, w: 400, h: 80 },
                { label: 'Undeveloped\nLand', color: '#e5e7eb', textColor: '#374151', x: 0, y: 236, w: 400, h: 64 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Smart\nGatehouse & EV Charging', color: '#6ee7b7', textColor: '#064e3b', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Tech\nCompany A', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 50, w: 195, h: 90 },
                { label: 'Tech\nCompany B', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 50, w: 195, h: 90 },
                { label: 'Underground\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 0, y: 148, w: 195, h: 80 },
                { label: 'Rooftop\nGarden & Café', color: '#86efac', textColor: '#166534', x: 205, y: 148, w: 195, h: 80 },
                { label: 'Start-up\nIncubator', color: '#a78bfa', textColor: '#4c1d95', x: 0, y: 236, w: 195, h: 64 },
                { label: 'Conference\nCentre', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 236, w: 195, h: 64 },
              ],
            },
          ],
        },
      },
      {
        title: 'Waterside Regeneration at Dockholm',
        instruction: 'The maps below show the waterside area of Dockholm before and after a regeneration project. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Regeneration',
              elements: [
                { label: 'Old\nSteelworks Site', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 110 },
                { label: 'Dock\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 110, w: 400, h: 12 },
                { label: 'Dry\nDock 1', color: '#d1d5db', textColor: '#374151', x: 0, y: 130, w: 190, h: 70 },
                { label: 'Dry\nDock 2', color: '#d1d5db', textColor: '#374151', x: 200, y: 130, w: 200, h: 70 },
                { label: 'Harbour\n(industrial)', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 208, w: 400, h: 60 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
            {
              label: 'After Regeneration',
              elements: [
                { label: 'Residential\nNeighbourhood (350)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 110 },
                { label: 'Mixed-Use\n(offices + retail)', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 110 },
                { label: 'Waterfront\nPromenade', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 110, w: 400, h: 12 },
                { label: 'Marina\n(leisure)', color: '#06b6d4', textColor: '#fff', x: 0, y: 130, w: 190, h: 70 },
                { label: 'Floating\nRestaurants & Bars', color: '#fde68a', textColor: '#78350f', x: 200, y: 130, w: 200, h: 70 },
                { label: 'Harbour\n(mixed use)', color: '#60a5fa', textColor: '#1e3a8a', x: 0, y: 208, w: 400, h: 60 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
          ],
        },
      },
      {
        title: 'Community Farm of Fieldstone – Before and After',
        instruction: 'The maps below show the Fieldstone site before and after it was converted into a community farm. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Community Farm',
              elements: [
                { label: 'Neglected\nAgricultural Land', color: '#e5e7eb', textColor: '#374151', x: 0, y: 0, w: 400, h: 130 },
                { label: 'Derelict\nFarm Buildings', color: '#d1d5db', textColor: '#374151', x: 0, y: 140, w: 195, h: 80 },
                { label: 'Overgrown\nOrchard', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 140, w: 195, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Housing\n(adjacent)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After Community Farm',
              elements: [
                { label: 'Vegetable\nAllotments (80 plots)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 195, h: 130 },
                { label: 'Livestock\nArea (hens, goats)', color: '#fef08a', textColor: '#713f12', x: 205, y: 0, w: 195, h: 130 },
                { label: 'Converted\nFarm Café & Shop', color: '#fde68a', textColor: '#78350f', x: 0, y: 140, w: 195, h: 80 },
                { label: 'Restored\nOrchard', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 140, w: 195, h: 80 },
                { label: 'Road\n(cycle access added)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Housing\n(adjacent)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      {
        title: 'Northgate Station Area – Urban Regeneration',
        instruction: 'The maps below show the Northgate station area before and after an urban regeneration scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Regeneration',
              elements: [
                { label: 'Railway\nStation', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 55 },
                { label: 'Station\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 55, w: 400, h: 12 },
                { label: 'Empty\nShop Units', color: '#d1d5db', textColor: '#374151', x: 0, y: 75, w: 195, h: 80 },
                { label: 'Surface\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 205, y: 75, w: 195, h: 80 },
                { label: 'Neglected\nPark', color: '#e5e7eb', textColor: '#374151', x: 0, y: 163, w: 400, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 251, w: 400, h: 12 },
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 271, w: 400, h: 29 },
              ],
            },
            {
              label: 'After Regeneration',
              elements: [
                { label: 'Modernised\nStation', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 55 },
                { label: 'Pedestrian\nStation Square', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 55, w: 400, h: 12 },
                { label: 'New Retail\n& Restaurants', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 75, w: 195, h: 80 },
                { label: 'Multi-Storey\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 205, y: 75, w: 195, h: 80 },
                { label: 'Renovated\nPark & Play Area', color: '#86efac', textColor: '#166534', x: 0, y: 163, w: 400, h: 80 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 251, w: 400, h: 12 },
                { label: 'Residential\nArea', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 271, w: 400, h: 29 },
              ],
            },
          ],
        },
      },
      {
        title: 'New Town District of Millfield (2000 vs 2022)',
        instruction: 'The maps below show the new town district of Millfield in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Farmland\n(greenfield site)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 130 },
                { label: 'Proposed\nRoad (route)', color: '#d4d4d4', textColor: '#374151', x: 0, y: 130, w: 400, h: 10 },
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 148, w: 400, h: 152 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Residential\nZone (1,200 homes)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 130 },
                { label: 'District\nCentre (shops + GP)', color: '#ddd6fe', textColor: '#4c1d95', x: 205, y: 0, w: 195, h: 130 },
                { label: 'District\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 130, w: 400, h: 10 },
                { label: 'Primary\nSchool', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 148, w: 130, h: 100 },
                { label: 'Central\nPark', color: '#86efac', textColor: '#166534', x: 140, y: 148, w: 120, h: 100 },
                { label: 'Community\nSports Hub', color: '#6ee7b7', textColor: '#064e3b', x: 270, y: 148, w: 130, h: 100 },
                { label: 'Cycle &\nWalkway Network', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 256, w: 400, h: 44 },
              ],
            },
          ],
        },
      },
      {
        title: 'Leisure Centre at Bayview – Before and After',
        instruction: 'The maps below show the Bayview leisure centre before and after a major refurbishment and expansion. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Refurbishment',
              elements: [
                { label: 'Car Park\n(entrance)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 44 },
                { label: 'Main Pool\n(25m)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 54, w: 195, h: 100 },
                { label: 'Sports\nHall', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 54, w: 195, h: 100 },
                { label: 'Changing\nRooms', color: '#d1d5db', textColor: '#374151', x: 0, y: 162, w: 130, h: 70 },
                { label: 'Café', color: '#fde68a', textColor: '#78350f', x: 140, y: 162, w: 120, h: 70 },
                { label: 'Unused\nArea', color: '#e5e7eb', textColor: '#374151', x: 270, y: 162, w: 130, h: 70 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 240, w: 400, h: 10 },
                { label: 'Grounds', color: '#86efac', textColor: '#166534', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
            {
              label: 'After Refurbishment',
              elements: [
                { label: 'Expanded\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 0, w: 400, h: 44 },
                { label: 'Olympic\nPool (50m)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 54, w: 195, h: 100 },
                { label: 'Sports\nHall', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 54, w: 195, h: 100 },
                { label: 'Changing\nRooms (new)', color: '#d1d5db', textColor: '#374151', x: 0, y: 162, w: 130, h: 70 },
                { label: 'Health Café\n& Gym', color: '#fde68a', textColor: '#78350f', x: 140, y: 162, w: 120, h: 70 },
                { label: 'Climbing\nWall (new)', color: '#a78bfa', textColor: '#4c1d95', x: 270, y: 162, w: 130, h: 70 },
                { label: 'Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 240, w: 400, h: 10 },
                { label: 'Outdoor\nCourts & Trim Trail', color: '#86efac', textColor: '#166534', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
          ],
        },
      },
      {
        title: 'Warehouse District of Brickley (1995 vs 2022)',
        instruction: 'The maps below show the warehouse district of Brickley in 1995 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1995',
              elements: [
                { label: 'Warehouse\nRow A', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Loading\nBay Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 80, w: 400, h: 12 },
                { label: 'Warehouse\nRow B', color: '#d1d5db', textColor: '#374151', x: 0, y: 100, w: 400, h: 80 },
                { label: 'Back\nAccess Road', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 188, w: 400, h: 12 },
                { label: 'HGV\nParking Yard', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 208, w: 400, h: 92 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Creative\nIndustry Units (Row A)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Tree-Lined\nStreet', color: '#86efac', textColor: '#166534', x: 0, y: 80, w: 400, h: 12 },
                { label: 'Pop-up Retail\n& Food Market (Row B)', color: '#fde68a', textColor: '#78350f', x: 0, y: 100, w: 400, h: 80 },
                { label: 'Cycle\nPath', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 188, w: 400, h: 12 },
                { label: 'Urban\nPlaza & Outdoor Market', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 208, w: 195, h: 92 },
                { label: 'Underground\nCar Park', color: '#64748b', textColor: '#f9fafb', x: 205, y: 208, w: 195, h: 92 },
              ],
            },
          ],
        },
      },
      {
        title: 'Military Base of Crossfield – Before and After Conversion',
        instruction: 'The maps below show the Crossfield military base before decommissioning and after conversion for civilian use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Military Base in Use',
              elements: [
                { label: 'Security\nFence', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 12 },
                { label: 'Barracks\n& Admin', color: '#9ca3af', textColor: '#1f2937', x: 10, y: 22, w: 180, h: 100 },
                { label: 'Vehicle\nPool', color: '#d1d5db', textColor: '#374151', x: 200, y: 22, w: 190, h: 100 },
                { label: 'Training\nGround', color: '#e5e7eb', textColor: '#374151', x: 10, y: 132, w: 380, h: 100 },
                { label: 'Security\nFence', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 238, w: 400, h: 12 },
                { label: 'Buffer\nZone & Trees', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
            {
              label: 'After Civilian Conversion',
              elements: [
                { label: 'Open\nBoundary', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 0, w: 400, h: 12 },
                { label: 'Converted\nHousing (150)', color: '#fdba74', textColor: '#7c2d12', x: 10, y: 22, w: 180, h: 100 },
                { label: 'Business\nPark', color: '#c4b5fd', textColor: '#5b21b6', x: 200, y: 22, w: 190, h: 100 },
                { label: 'Community\nSports Park & Track', color: '#4ade80', textColor: '#14532d', x: 10, y: 132, w: 380, h: 100 },
                { label: 'Public\nRoad (new)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 238, w: 400, h: 12 },
                { label: 'Tree-lined\nNeighbourhood Walk', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
          ],
        },
      },
      {
        title: 'Rivermouth Estuary Town (1980 vs 2022)',
        instruction: 'The maps below show the estuary town of Rivermouth in 1980 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1980',
              elements: [
                { label: 'Farmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 90 },
                { label: 'Main Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Old Town\nHouses', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 110, w: 180, h: 80 },
                { label: 'Mud\nFlats & Salt Marsh', color: '#a7f3d0', textColor: '#065f46', x: 190, y: 110, w: 210, h: 80 },
                { label: 'Estuary\n(tidal)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 198, w: 400, h: 52 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'New\nHousing (240)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Solar\nFarm', color: '#fef08a', textColor: '#713f12', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Main Road\n(improved)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 400, h: 12 },
                { label: 'Old Town\nHouses', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 110, w: 180, h: 80 },
                { label: 'Managed\nNature Reserve', color: '#a7f3d0', textColor: '#065f46', x: 190, y: 110, w: 210, h: 80 },
                { label: 'Estuary\n(tidal)', color: '#7dd3fc', textColor: '#0c4a6e', x: 0, y: 198, w: 400, h: 52 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 258, w: 400, h: 42 },
              ],
            },
          ],
        },
      },
      {
        title: 'Urban Renewal Zone – Former Housing Estate',
        instruction: 'The maps below show a former social housing estate before and after a comprehensive renewal programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Renewal',
              elements: [
                { label: 'Tower\nBlock A (18 floors)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 90, h: 90 },
                { label: 'Tower\nBlock B (18 floors)', color: '#9ca3af', textColor: '#1f2937', x: 100, y: 0, w: 90, h: 90 },
                { label: 'Tower\nBlock C (18 floors)', color: '#9ca3af', textColor: '#1f2937', x: 200, y: 0, w: 90, h: 90 },
                { label: 'Surface\nCar Park', color: '#94a3b8', textColor: '#1e293b', x: 300, y: 0, w: 100, h: 90 },
                { label: 'Estate\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 98, w: 400, h: 10 },
                { label: 'Low-Rise\nFlats (100)', color: '#d1d5db', textColor: '#374151', x: 0, y: 116, w: 260, h: 90 },
                { label: 'Derelict\nCommunity Centre', color: '#e5e7eb', textColor: '#374151', x: 270, y: 116, w: 130, h: 90 },
                { label: 'Underused\nPark (poor state)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 214, w: 400, h: 86 },
              ],
            },
            {
              label: 'After Renewal',
              elements: [
                { label: 'New Mid-Rise\nApartments A', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 130, h: 90 },
                { label: 'New Mid-Rise\nApartments B', color: '#fdba74', textColor: '#7c2d12', x: 140, y: 0, w: 130, h: 90 },
                { label: 'Retail\n& New Homes', color: '#ddd6fe', textColor: '#4c1d95', x: 280, y: 0, w: 120, h: 90 },
                { label: 'New Street\n(tree-lined)', color: '#86efac', textColor: '#166534', x: 0, y: 98, w: 400, h: 10 },
                { label: 'Townhouses\n& Gardens (60)', color: '#fed7aa', textColor: '#9a3412', x: 0, y: 116, w: 260, h: 90 },
                { label: 'New Community\nCentre & Library', color: '#a5f3fc', textColor: '#164e63', x: 270, y: 116, w: 130, h: 90 },
                { label: 'Renovated\nPark & MUGA', color: '#86efac', textColor: '#166534', x: 0, y: 214, w: 400, h: 86 },
              ],
            },
          ],
        },
      },
      {
        title: 'Coastal Farmland of Saltmarsh – Before and After',
        instruction: 'The maps below show the coastal farmland area of Saltmarsh before and after a resort development project. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Crop\nFarmland', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 120 },
                { label: 'Farm\nTrack', color: '#d4d4d4', textColor: '#374151', x: 0, y: 120, w: 400, h: 8 },
                { label: 'Salt\nMarsh', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 136, w: 400, h: 70 },
                { label: 'Shingle\nBeach', color: '#fef08a', textColor: '#78350f', x: 0, y: 214, w: 400, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 252, w: 400, h: 48 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'Caravan\nPark (100 pitches)', color: '#fef08a', textColor: '#713f12', x: 0, y: 0, w: 195, h: 120 },
                { label: 'Static\nHoliday Homes (60)', color: '#fed7aa', textColor: '#9a3412', x: 205, y: 0, w: 195, h: 120 },
                { label: 'Resort\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 120, w: 400, h: 10 },
                { label: 'Managed\nNature Trail', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 138, w: 195, h: 68 },
                { label: 'Café,\nShop & Toilets', color: '#fde68a', textColor: '#78350f', x: 205, y: 138, w: 195, h: 68 },
                { label: 'Developed\nBeach (beach huts)', color: '#fef08a', textColor: '#78350f', x: 0, y: 214, w: 400, h: 30 },
                { label: 'Sea', color: '#bae6fd', textColor: '#0c4a6e', x: 0, y: 252, w: 400, h: 48 },
              ],
            },
          ],
        },
      },
      {
        title: 'Cross-Roads Settlement of Junctiontown – Before and After',
        instruction: 'The maps below show the cross-roads settlement of Junctiontown before and after a development scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Development',
              elements: [
                { label: 'Farmland\n(NW)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 190, h: 138 },
                { label: 'Farmland\n(NE)', color: '#86efac', textColor: '#166534', x: 210, y: 0, w: 190, h: 138 },
                { label: 'N–S Road', color: '#9ca3af', textColor: '#1f2937', x: 193, y: 0, w: 14, h: 300 },
                { label: 'E–W Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 141, w: 400, h: 14 },
                { label: 'Petrol\nStation (SW)', color: '#fde68a', textColor: '#78350f', x: 0, y: 163, w: 185, h: 80 },
                { label: 'Small\nHamlet (SE)', color: '#fdba74', textColor: '#7c2d12', x: 215, y: 163, w: 185, h: 80 },
                { label: 'Farmland\n(south)', color: '#86efac', textColor: '#166534', x: 0, y: 251, w: 400, h: 49 },
              ],
            },
            {
              label: 'After Development',
              elements: [
                { label: 'New\nHousing (NW, 120)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 0, w: 185, h: 130 },
                { label: 'Primary\nSchool (NE)', color: '#93c5fd', textColor: '#1e3a8a', x: 215, y: 0, w: 185, h: 130 },
                { label: 'Roundabout\n& Lanes', color: '#6b7280', textColor: '#f9fafb', x: 155, y: 130, w: 90, h: 40 },
                { label: 'Retail\nPark (SW)', color: '#ddd6fe', textColor: '#4c1d95', x: 0, y: 178, w: 145, h: 80 },
                { label: 'Doctor\'s\nSurgery (SE)', color: '#fca5a5', textColor: '#7f1d1d', x: 255, y: 178, w: 145, h: 80 },
                { label: 'New\nHousing (south)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 266, w: 400, h: 34 },
              ],
            },
          ],
        },
      },
      {
        title: 'Theme Park of Funton – Before and After Expansion',
        instruction: 'The maps below show the Funton theme park before and after an expansion programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before Expansion',
              elements: [
                { label: 'Main\nEntrance', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Roller\nCoaster Zone', color: '#ef4444', textColor: '#fff', x: 0, y: 50, w: 195, h: 100 },
                { label: 'Water\nPark Area', color: '#7dd3fc', textColor: '#0c4a6e', x: 205, y: 50, w: 195, h: 100 },
                { label: 'Food\nCourt', color: '#fde68a', textColor: '#78350f', x: 0, y: 158, w: 120, h: 80 },
                { label: 'Family\nRides Zone', color: '#a7f3d0', textColor: '#065f46', x: 130, y: 158, w: 140, h: 80 },
                { label: 'Unused\nLand', color: '#e5e7eb', textColor: '#374151', x: 280, y: 158, w: 120, h: 80 },
                { label: 'Car Park', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 246, w: 400, h: 54 },
              ],
            },
            {
              label: 'After Expansion',
              elements: [
                { label: 'Main\nEntrance', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Roller\nCoaster Zone', color: '#ef4444', textColor: '#fff', x: 0, y: 50, w: 195, h: 100 },
                { label: 'Water\nPark Area', color: '#7dd3fc', textColor: '#0c4a6e', x: 205, y: 50, w: 195, h: 100 },
                { label: 'Food\nCourt', color: '#fde68a', textColor: '#78350f', x: 0, y: 158, w: 120, h: 80 },
                { label: 'Family\nRides Zone', color: '#a7f3d0', textColor: '#065f46', x: 130, y: 158, w: 140, h: 80 },
                { label: 'New VR\n& Gaming Zone', color: '#8b5cf6', textColor: '#fff', x: 280, y: 158, w: 120, h: 80 },
                { label: 'Car Park\n(expanded)', color: '#94a3b8', textColor: '#1e293b', x: 0, y: 246, w: 260, h: 54 },
                { label: 'On-Site\nHotel (new)', color: '#06b6d4', textColor: '#fff', x: 270, y: 246, w: 130, h: 54 },
              ],
            },
          ],
        },
      },
      {
        title: 'Railway Yard of Junctionfield – Before and After Conversion',
        instruction: 'The maps below show the Junctionfield railway yard before closure and after conversion to a new urban neighbourhood. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Railway Yard in Operation',
              elements: [
                { label: 'Active\nRailway Lines (x6)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Locomotive\nShed', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 180, h: 80 },
                { label: 'Goods\nWarehouse', color: '#d1d5db', textColor: '#374151', x: 190, y: 90, w: 210, h: 80 },
                { label: 'Maintenance\nWorkshops', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 178, w: 400, h: 80 },
                { label: 'Perimeter\nFencing', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 266, w: 400, h: 10 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
            {
              label: 'After Conversion',
              elements: [
                { label: 'Active\nRailway Lines (x2 retained)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Apartments\n(180 units)', color: '#fdba74', textColor: '#7c2d12', x: 0, y: 50, w: 195, h: 110 },
                { label: 'Office\nComplex', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 50, w: 195, h: 110 },
                { label: 'Boulevard\n& Cycle Lane', color: '#86efac', textColor: '#166534', x: 0, y: 168, w: 400, h: 12 },
                { label: 'Café &\nLocal Shops', color: '#fde68a', textColor: '#78350f', x: 0, y: 188, w: 195, h: 70 },
                { label: 'Linear\nPark (heritage rail trail)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 188, w: 195, h: 70 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 266, w: 400, h: 12 },
                { label: 'Plaza &\nPublic Art', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
          ],
        },
      },
      // 59
      {
        title: 'Coastal Village of Seaholm – Before and After Tourism Development',
        instruction: 'The maps below show the coastal village of Seaholm before and after tourism development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1990)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Beach', color: '#fef9c3', textColor: '#713f12', x: 0, y: 60, w: 400, h: 30 },
                { label: 'Fishing\nBoats', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 90, w: 120, h: 50 },
                { label: 'Fish\nMarket', color: '#fed7aa', textColor: '#7c2d12', x: 130, y: 90, w: 120, h: 50 },
                { label: 'Farmland', color: '#bbf7d0', textColor: '#14532d', x: 260, y: 90, w: 140, h: 50 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 148, w: 400, h: 12 },
                { label: 'Village\nHouses', color: '#fde68a', textColor: '#78350f', x: 0, y: 168, w: 195, h: 80 },
                { label: 'Church &\nGraveyard', color: '#e9d5ff', textColor: '#5b21b6', x: 205, y: 168, w: 195, h: 80 },
                { label: 'Fields', color: '#d1fae5', textColor: '#065f46', x: 0, y: 256, w: 400, h: 44 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Beach\n(cleaned & managed)', color: '#fef9c3', textColor: '#713f12', x: 0, y: 60, w: 400, h: 30 },
                { label: 'Marina &\nWatersports', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 90, w: 195, h: 50 },
                { label: 'Seafood\nRestaurants', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 90, w: 195, h: 50 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 148, w: 400, h: 12 },
                { label: 'Hotel\nComplex', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 168, w: 195, h: 80 },
                { label: 'Tourist\nShops & Cafés', color: '#fde68a', textColor: '#78350f', x: 205, y: 168, w: 195, h: 80 },
                { label: 'Car Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 256, w: 195, h: 44 },
                { label: 'Holiday\nCabins', color: '#fef3c7', textColor: '#78350f', x: 205, y: 256, w: 195, h: 44 },
              ],
            },
          ],
        },
      },
      // 60
      {
        title: 'Town of Ashford – Before and After Inner Ring Road',
        instruction: 'The maps below show the town of Ashford before and after the construction of an inner ring road. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1995)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 70 },
                { label: 'High\nStreet', color: '#9ca3af', textColor: '#1f2937', x: 170, y: 70, w: 20, h: 160 },
                { label: 'Shops\n(West)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 70, w: 165, h: 70 },
                { label: 'Town\nCentre & Market', color: '#fca5a5', textColor: '#7f1d1d', x: 195, y: 70, w: 205, h: 70 },
                { label: 'Schools\n& Library', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 148, w: 165, h: 90 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 195, y: 148, w: 205, h: 90 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 246, w: 400, h: 54 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 55 },
                { label: 'Ring\nRoad (North)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 55, w: 400, h: 15 },
                { label: 'Pedestrian\nZone & Shops', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 78, w: 195, h: 65 },
                { label: 'Town\nSquare (renovated)', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 78, w: 195, h: 65 },
                { label: 'Ring\nRoad (East/West)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 148, w: 400, h: 12 },
                { label: 'New\nLibrary & Community Centre', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 168, w: 195, h: 80 },
                { label: 'Mixed-Use\nDevelopment', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 168, w: 195, h: 80 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 256, w: 400, h: 44 },
              ],
            },
          ],
        },
      },
      // 61
      {
        title: 'Hillside Village of Thornbury – Before and After Wind Farm',
        instruction: 'The maps below show the hillside village of Thornbury before and after the construction of a nearby wind farm. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Moorland\n& Hills', color: '#d1fae5', textColor: '#065f46', x: 0, y: 0, w: 400, h: 90 },
                { label: 'Farm\nLand', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 90, w: 195, h: 70 },
                { label: 'Village\nHouses', color: '#fde68a', textColor: '#78350f', x: 205, y: 90, w: 195, h: 70 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 168, w: 400, h: 12 },
                { label: 'Village\nShops & Church', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 188, w: 195, h: 70 },
                { label: 'Fields &\nOrchards', color: '#d1fae5', textColor: '#065f46', x: 205, y: 188, w: 195, h: 70 },
                { label: 'River\nWalton', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 266, w: 400, h: 34 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Wind\nFarm (12 turbines)', color: '#e0f2fe', textColor: '#0369a1', x: 0, y: 0, w: 400, h: 90 },
                { label: 'Access\nRoad to Wind Farm', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 90, w: 120, h: 70 },
                { label: 'Substation\n& Grid Connection', color: '#fca5a5', textColor: '#7f1d1d', x: 130, y: 90, w: 65, h: 70 },
                { label: 'Village\nHouses (expanded)', color: '#fde68a', textColor: '#78350f', x: 205, y: 90, w: 195, h: 70 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 168, w: 400, h: 12 },
                { label: 'Village\nCentre & Visitor Hub', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 188, w: 195, h: 70 },
                { label: 'Community\nGarden & Orchard', color: '#d1fae5', textColor: '#065f46', x: 205, y: 188, w: 195, h: 70 },
                { label: 'River\nWalton', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 266, w: 400, h: 34 },
              ],
            },
          ],
        },
      },
      // 62
      {
        title: 'Retail Park of Westfield Edge – Before and After Redevelopment',
        instruction: 'The maps below show the retail park of Westfield Edge before and after redevelopment. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Large\nSupermarket', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 20, w: 195, h: 100 },
                { label: 'DIY\nStore', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 20, w: 195, h: 100 },
                { label: 'Surface\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 128, w: 400, h: 80 },
                { label: 'Fast\nFood Outlets', color: '#fde68a', textColor: '#78350f', x: 0, y: 216, w: 195, h: 50 },
                { label: 'Petrol\nStation', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 216, w: 195, h: 50 },
                { label: 'Boundary\nFence', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Mixed-Use\nApartments & Retail', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 20, w: 195, h: 100 },
                { label: 'Office\nBuildings', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 20, w: 195, h: 100 },
                { label: 'Underground\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 128, w: 195, h: 70 },
                { label: 'Public\nPark & Play Area', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 128, w: 195, h: 70 },
                { label: 'Cycle\nLane & Pedestrian Path', color: '#86efac', textColor: '#166534', x: 0, y: 206, w: 400, h: 12 },
                { label: 'Café &\nMarket Space', color: '#fde68a', textColor: '#78350f', x: 0, y: 226, w: 195, h: 50 },
                { label: 'Electric\nVehicle Charging Hub', color: '#6ee7b7', textColor: '#064e3b', x: 205, y: 226, w: 195, h: 50 },
                { label: 'Green\nBoundary Planting', color: '#d1fae5', textColor: '#065f46', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
          ],
        },
      },
      // 63
      {
        title: 'Former Hospital Site of Greystone – Before and After Housing Development',
        instruction: 'The maps below show a former hospital site in the town of Greystone before and after its conversion into a housing development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Main\nHospital Building', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 0, w: 260, h: 100 },
                { label: 'Chapel', color: '#e9d5ff', textColor: '#5b21b6', x: 270, y: 0, w: 130, h: 50 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 270, y: 58, w: 130, h: 42 },
                { label: 'Hospital\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Staff\nResidence', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 128, w: 130, h: 80 },
                { label: 'Gardens\n& Lawns', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 128, w: 120, h: 80 },
                { label: 'Outpatient\nBlock', color: '#fca5a5', textColor: '#7f1d1d', x: 270, y: 128, w: 130, h: 80 },
                { label: 'Open\nGround', color: '#d1fae5', textColor: '#065f46', x: 0, y: 216, w: 400, h: 84 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Converted\nApartments (heritage)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 0, w: 260, h: 100 },
                { label: 'Community\nHall (former chapel)', color: '#e9d5ff', textColor: '#5b21b6', x: 270, y: 0, w: 130, h: 50 },
                { label: 'Cycle\nStore & EV Parking', color: '#6ee7b7', textColor: '#064e3b', x: 270, y: 58, w: 130, h: 42 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 108, w: 400, h: 12 },
                { label: 'Terraced\nHouses', color: '#fde68a', textColor: '#78350f', x: 0, y: 128, w: 195, h: 80 },
                { label: 'New\nApartment Block', color: '#fde68a', textColor: '#78350f', x: 205, y: 128, w: 195, h: 80 },
                { label: 'Central\nGarden & Play Area', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 216, w: 195, h: 84 },
                { label: 'Detached\nHouses', color: '#fde68a', textColor: '#78350f', x: 205, y: 216, w: 195, h: 84 },
              ],
            },
          ],
        },
      },
      // 64
      {
        title: 'Rural Crossroads of Mapleton – Before and After Service Station Development',
        instruction: 'The maps below show the rural crossroads area of Mapleton before and after the construction of a motorway service station. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1998)',
              elements: [
                { label: 'Motorway\n(M7)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 20 },
                { label: 'Farmland\n(West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 28, w: 195, h: 120 },
                { label: 'Farmland\n(East)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 28, w: 195, h: 120 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 156, w: 400, h: 12 },
                { label: 'Small\nFarmhouse', color: '#fde68a', textColor: '#78350f', x: 0, y: 176, w: 130, h: 70 },
                { label: 'Open\nFields', color: '#d1fae5', textColor: '#065f46', x: 140, y: 176, w: 260, h: 70 },
                { label: 'Woodland', color: '#86efac', textColor: '#166534', x: 0, y: 254, w: 400, h: 46 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Motorway\n(M7)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 20 },
                { label: 'Motorway\nSlip Road', color: '#9ca3af', textColor: '#1f2937', x: 160, y: 20, w: 80, h: 25 },
                { label: 'Fuel\nStation', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 52, w: 130, h: 80 },
                { label: 'Restaurant\n& Shop', color: '#fed7aa', textColor: '#7c2d12', x: 140, y: 52, w: 120, h: 80 },
                { label: 'HGV\nParking', color: '#d1d5db', textColor: '#374151', x: 270, y: 52, w: 130, h: 80 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 0, y: 140, w: 400, h: 28 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 176, w: 400, h: 12 },
                { label: 'Hotel\n(budget)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 196, w: 195, h: 60 },
                { label: 'Retained\nWoodland', color: '#86efac', textColor: '#166534', x: 205, y: 196, w: 195, h: 104 },
                { label: 'Landscaped\nBuffer Zone', color: '#d1fae5', textColor: '#065f46', x: 0, y: 264, w: 195, h: 36 },
              ],
            },
          ],
        },
      },
      // 65
      {
        title: 'Former Gasworks Site of Ironbank – Before and After Urban Regeneration',
        instruction: 'The maps below show the former gasworks site of Ironbank before and after urban regeneration. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1990)',
              elements: [
                { label: 'Canal', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 25 },
                { label: 'Gas\nHolder 1', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 33, w: 120, h: 100 },
                { label: 'Gas\nHolder 2', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 33, w: 120, h: 100 },
                { label: 'Office &\nControl Building', color: '#6b7280', textColor: '#f9fafb', x: 280, y: 33, w: 120, h: 100 },
                { label: 'Industrial\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 141, w: 400, h: 12 },
                { label: 'Storage\nTanks', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 161, w: 195, h: 80 },
                { label: 'Waste\nGround', color: '#d1d5db', textColor: '#374151', x: 205, y: 161, w: 195, h: 80 },
                { label: 'Railway\nLine', color: '#374151', textColor: '#f9fafb', x: 0, y: 249, w: 400, h: 18 },
                { label: 'Derelict\nLand', color: '#d1d5db', textColor: '#374151', x: 0, y: 275, w: 400, h: 25 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Canal\n(towpath restored)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 25 },
                { label: 'Waterside\nApartments', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 33, w: 195, h: 100 },
                { label: 'Café &\nArts Space', color: '#fde68a', textColor: '#78350f', x: 205, y: 33, w: 195, h: 100 },
                { label: 'New\nBoulevard', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 141, w: 400, h: 12 },
                { label: 'Office\nComplex', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 161, w: 195, h: 80 },
                { label: 'Public\nPark & Cycle Route', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 161, w: 195, h: 80 },
                { label: 'Light\nRail Stop', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 249, w: 195, h: 25 },
                { label: 'Rail\nLine (retained)', color: '#374151', textColor: '#f9fafb', x: 205, y: 249, w: 195, h: 25 },
                { label: 'Riverside\nWalk', color: '#d1fae5', textColor: '#065f46', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
          ],
        },
      },
      // 66
      {
        title: 'Cliffside Town of Rockledge – Before and After Landslide Prevention Works',
        instruction: 'The maps below show the cliffside town of Rockledge before and after landslide prevention works. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Cliff\nEdge & Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Cliff\nPath', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 40, w: 400, h: 12 },
                { label: 'Unstable\nCliff Face', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 60, w: 400, h: 50 },
                { label: 'Beach\nHouses', color: '#fde68a', textColor: '#78350f', x: 0, y: 118, w: 195, h: 60 },
                { label: 'Hotel\n(at risk)', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 118, w: 195, h: 60 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 186, w: 400, h: 12 },
                { label: 'Town\nCentre', color: '#fde68a', textColor: '#78350f', x: 0, y: 206, w: 195, h: 70 },
                { label: 'Residential\nArea', color: '#fde68a', textColor: '#78350f', x: 205, y: 206, w: 195, h: 70 },
                { label: 'South\nFields', color: '#d1fae5', textColor: '#065f46', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Cliff\nEdge & Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Cliff\nPath (secured)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 40, w: 400, h: 12 },
                { label: 'Rock\nArmour & Retaining Wall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 60, w: 400, h: 50 },
                { label: 'Beach\nHouses (retained)', color: '#fde68a', textColor: '#78350f', x: 0, y: 118, w: 195, h: 60 },
                { label: 'Hotel\n(renovated)', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 118, w: 195, h: 60 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 186, w: 400, h: 12 },
                { label: 'Town\nCentre (expanded)', color: '#fde68a', textColor: '#78350f', x: 0, y: 206, w: 195, h: 70 },
                { label: 'New\nHousing Estate', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 206, w: 195, h: 70 },
                { label: 'Coastal\nPark & Viewpoint', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
          ],
        },
      },
      // 67
      {
        title: 'Town of Ferndale – Before and After Solar Farm Development',
        instruction: 'The maps below show land on the outskirts of Ferndale before and after the construction of a solar farm. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2010)',
              elements: [
                { label: 'Town\nBoundary Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Arable\nFarmland (North)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 22, w: 400, h: 100 },
                { label: 'Farm\nTrack', color: '#9ca3af', textColor: '#1f2937', x: 190, y: 130, w: 20, h: 80 },
                { label: 'Pasture\nLand (West)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 130, w: 185, h: 80 },
                { label: 'Pasture\nLand (East)', color: '#d1fae5', textColor: '#065f46', x: 215, y: 130, w: 185, h: 80 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 218, w: 400, h: 12 },
                { label: 'Farmhouse\n& Outbuildings', color: '#fde68a', textColor: '#78350f', x: 0, y: 238, w: 195, h: 62 },
                { label: 'Mixed\nWoodland', color: '#86efac', textColor: '#166534', x: 205, y: 238, w: 195, h: 62 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Town\nBoundary Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Solar\nPanels (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 22, w: 400, h: 100 },
                { label: 'Security\nFence', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 130, w: 400, h: 8 },
                { label: 'Solar\nPanels (South)', color: '#fef3c7', textColor: '#78350f', x: 0, y: 146, w: 400, h: 64 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 218, w: 400, h: 12 },
                { label: 'Substation\n& Battery Storage', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 238, w: 195, h: 62 },
                { label: 'Retained\nWoodland', color: '#86efac', textColor: '#166534', x: 205, y: 238, w: 195, h: 62 },
              ],
            },
          ],
        },
      },
      // 68
      {
        title: 'Suburban District of Hazelwood – Before and After New Tram Line',
        instruction: 'The maps below show the suburban district of Hazelwood before and after the introduction of a new tram line. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 80 },
                { label: 'High\nStreet', color: '#9ca3af', textColor: '#1f2937', x: 190, y: 80, w: 20, h: 140 },
                { label: 'Shopping\nParade (West)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 80, w: 185, h: 70 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 215, y: 80, w: 185, h: 70 },
                { label: 'Primary\nSchool', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 158, w: 185, h: 62 },
                { label: 'Sports\nGround', color: '#bbf7d0', textColor: '#14532d', x: 215, y: 158, w: 185, h: 62 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Tram\nLine', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 80, w: 400, h: 10 },
                { label: 'Shopping\nParade (improved)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 98, w: 185, h: 60 },
                { label: 'Tram\nStop & Plaza', color: '#a5f3fc', textColor: '#164e63', x: 195, y: 98, w: 205, h: 60 },
                { label: 'School\n(expanded)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 166, w: 185, h: 54 },
                { label: 'Sports\nCentre (new building)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 166, w: 195, h: 54 },
                { label: 'Tram\nLine & Main Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 228, w: 400, h: 12 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
          ],
        },
      },
      // 69
      {
        title: 'Freshwater Lake of Stillmere – Before and After Leisure Development',
        instruction: 'The maps below show the area around Stillmere freshwater lake before and after leisure development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1995)',
              elements: [
                { label: 'Lake\nStillmere', color: '#bfdbfe', textColor: '#1e40af', x: 80, y: 40, w: 240, h: 150 },
                { label: 'Forest\n(North)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Forest\n(West)', color: '#86efac', textColor: '#166534', x: 0, y: 40, w: 80, h: 180 },
                { label: 'Forest\n(East)', color: '#86efac', textColor: '#166534', x: 320, y: 40, w: 80, h: 180 },
                { label: 'Marshland', color: '#d1fae5', textColor: '#065f46', x: 80, y: 198, w: 240, h: 42 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 248, w: 400, h: 12 },
                { label: 'Farmland', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 268, w: 400, h: 32 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Lake\nStillmere', color: '#bfdbfe', textColor: '#1e40af', x: 80, y: 40, w: 240, h: 150 },
                { label: 'Forest\n(North, retained)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Visitor\nCentre & Café', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 40, w: 80, h: 90 },
                { label: 'Canoe\nHire & Jetty', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 138, w: 80, h: 82 },
                { label: 'Nature\nTrail (East)', color: '#bbf7d0', textColor: '#14532d', x: 320, y: 40, w: 80, h: 180 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 80, y: 198, w: 120, h: 42 },
                { label: 'Picnic\nArea & Beach', color: '#fef9c3', textColor: '#713f12', x: 210, y: 198, w: 110, h: 42 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 248, w: 400, h: 12 },
                { label: 'Holiday\nCabins', color: '#fde68a', textColor: '#78350f', x: 0, y: 268, w: 195, h: 32 },
                { label: 'Retained\nFarmland', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 268, w: 195, h: 32 },
              ],
            },
          ],
        },
      },
      // 70
      {
        title: 'Town of Blackmoor – Before and After Regeneration of Former Colliery',
        instruction: 'The maps below show the former colliery site in the town of Blackmoor before and after regeneration. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1990)',
              elements: [
                { label: 'Colliery\nHeadgear', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 130, h: 90 },
                { label: 'Sorting\n& Processing Plant', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 0, w: 130, h: 90 },
                { label: 'Spoil\nHeap', color: '#d1d5db', textColor: '#374151', x: 280, y: 0, w: 120, h: 90 },
                { label: 'Industrial\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 98, w: 400, h: 12 },
                { label: 'Coal\nStorage Yard', color: '#374151', textColor: '#f9fafb', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Workers\nCanteen & Offices', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Railway\nSidings', color: '#374151', textColor: '#f9fafb', x: 0, y: 206, w: 400, h: 18 },
                { label: 'Derelict\nLand', color: '#d1d5db', textColor: '#374151', x: 0, y: 232, w: 400, h: 68 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Heritage\nMuseum (former headgear)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 130, h: 90 },
                { label: 'Community\nCentre & Library', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 0, w: 130, h: 90 },
                { label: 'Memorial\nPark & Garden', color: '#bbf7d0', textColor: '#14532d', x: 280, y: 0, w: 120, h: 90 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 98, w: 400, h: 12 },
                { label: 'New\nHousing Estate', color: '#fde68a', textColor: '#78350f', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Small\nBusiness Units', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Cycle\nWay (former railway)', color: '#86efac', textColor: '#166534', x: 0, y: 206, w: 400, h: 18 },
                { label: 'Sports\nFacilities & Allotments', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 232, w: 195, h: 68 },
                { label: 'Retail\nUnits & Car Park', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 232, w: 195, h: 68 },
              ],
            },
          ],
        },
      },
      // 71
      {
        title: 'University Research Campus of Ashmore (2002 vs 2022)',
        instruction: 'The maps below show the university research campus of Ashmore in 2002 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2002',
              elements: [
                { label: 'Main\nGate & Reception', color: '#fca5a5', textColor: '#7f1d1d', x: 175, y: 0, w: 50, h: 25 },
                { label: 'Science\nBlock A', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 33, w: 130, h: 90 },
                { label: 'Central\nQuadrangle', color: '#d1fae5', textColor: '#065f46', x: 140, y: 33, w: 120, h: 90 },
                { label: 'Engineering\nBlock B', color: '#c4b5fd', textColor: '#5b21b6', x: 270, y: 33, w: 130, h: 90 },
                { label: 'Campus\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 131, w: 400, h: 12 },
                { label: 'Library', color: '#fde68a', textColor: '#78350f', x: 0, y: 151, w: 130, h: 80 },
                { label: 'Staff\nOffices', color: '#fed7aa', textColor: '#7c2d12', x: 140, y: 151, w: 120, h: 80 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 270, y: 151, w: 130, h: 80 },
                { label: 'Sports\nField', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 239, w: 400, h: 61 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Main\nGate & Security', color: '#fca5a5', textColor: '#7f1d1d', x: 175, y: 0, w: 50, h: 25 },
                { label: 'Science\nBlock A (expanded)', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 33, w: 130, h: 90 },
                { label: 'Innovation\nHub', color: '#fde68a', textColor: '#78350f', x: 140, y: 33, w: 120, h: 90 },
                { label: 'Engineering\nBlock B (expanded)', color: '#c4b5fd', textColor: '#5b21b6', x: 270, y: 33, w: 130, h: 90 },
                { label: 'Campus\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 131, w: 400, h: 12 },
                { label: 'Library\n(extended)', color: '#fde68a', textColor: '#78350f', x: 0, y: 151, w: 130, h: 80 },
                { label: 'Student\nUnion & Café', color: '#fed7aa', textColor: '#7c2d12', x: 140, y: 151, w: 120, h: 80 },
                { label: 'Multi-Storey\nCar Park', color: '#d1d5db', textColor: '#374151', x: 270, y: 151, w: 130, h: 80 },
                { label: 'Sports\nCentre & Artificial Pitches', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 239, w: 195, h: 61 },
                { label: 'New\nResearch Block C', color: '#e0f2fe', textColor: '#0369a1', x: 205, y: 239, w: 195, h: 61 },
              ],
            },
          ],
        },
      },
      // 72
      {
        title: 'Market Town of Briergate – Before and After Pedestrianisation of High Street',
        instruction: 'The maps below show the market town of Briergate before and after the pedestrianisation of its high street. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Shops\n& Banks (North)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 70 },
                { label: 'High\nStreet (traffic)', color: '#6b7280', textColor: '#f9fafb', x: 150, y: 70, w: 100, h: 160 },
                { label: 'On-Street\nParking', color: '#d1d5db', textColor: '#374151', x: 0, y: 70, w: 145, h: 70 },
                { label: 'On-Street\nParking', color: '#d1d5db', textColor: '#374151', x: 260, y: 70, w: 140, h: 70 },
                { label: 'Bus\nStop', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 148, w: 145, h: 40 },
                { label: 'Market\nHall', color: '#fde68a', textColor: '#78350f', x: 260, y: 148, w: 140, h: 40 },
                { label: 'Car\nPark (South)', color: '#d1d5db', textColor: '#374151', x: 0, y: 196, w: 400, h: 34 },
                { label: 'Shops\n& Pubs (South)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 238, w: 400, h: 62 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Shops\n& Cafés (North)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 0, w: 400, h: 70 },
                { label: 'Pedestrian\nZone (planting & seating)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 70, w: 400, h: 60 },
                { label: 'Cycle\nLane', color: '#86efac', textColor: '#166534', x: 0, y: 138, w: 400, h: 12 },
                { label: 'Outdoor\nMarket', color: '#fef9c3', textColor: '#713f12', x: 0, y: 158, w: 195, h: 70 },
                { label: 'Community\nSpace & Events', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 158, w: 195, h: 70 },
                { label: 'Car\nPark (relocated, multi-storey)', color: '#d1d5db', textColor: '#374151', x: 0, y: 236, w: 195, h: 64 },
                { label: 'Shops\n& Restaurants (South)', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 236, w: 195, h: 64 },
              ],
            },
          ],
        },
      },
      // 73
      {
        title: 'Harbour Town of Saltwick – Before and After Commercial Port Expansion',
        instruction: 'The maps below show the harbour town of Saltwick before and after commercial port expansion. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1995)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Harbour\nWall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 50, w: 400, h: 12 },
                { label: 'Fishing\nQuay', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 70, w: 195, h: 60 },
                { label: 'Cargo\nDock', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 70, w: 195, h: 60 },
                { label: 'Harbour\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 138, w: 400, h: 12 },
                { label: 'Fish\nMarket', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 158, w: 130, h: 80 },
                { label: 'Chandlery\n& Marine Supplies', color: '#fde68a', textColor: '#78350f', x: 140, y: 158, w: 120, h: 80 },
                { label: 'Town\nHouses', color: '#fde68a', textColor: '#78350f', x: 270, y: 158, w: 130, h: 80 },
                { label: 'Town\nCentre', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 246, w: 400, h: 54 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Extended\nHarbour Wall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 50, w: 400, h: 12 },
                { label: 'Container\nTerminal', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 70, w: 195, h: 60 },
                { label: 'RoRo\nVehicle Terminal', color: '#6b7280', textColor: '#f9fafb', x: 205, y: 70, w: 195, h: 60 },
                { label: 'Harbour\nRoad (widened)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 138, w: 400, h: 12 },
                { label: 'Logistics\nWarehouses', color: '#d1d5db', textColor: '#374151', x: 0, y: 158, w: 195, h: 80 },
                { label: 'Port\nOffices', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 158, w: 195, h: 80 },
                { label: 'Retained\nTown Centre', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 246, w: 195, h: 54 },
                { label: 'New\nMarket & Seafood Restaurants', color: '#fde68a', textColor: '#78350f', x: 205, y: 246, w: 195, h: 54 },
              ],
            },
          ],
        },
      },
      // 74
      {
        title: 'Green Belt Land of Millford – Before and After New Garden Suburb',
        instruction: 'The maps below show green belt land on the edge of Millford before and after the construction of a new garden suburb. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Existing\nTown Edge', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Green\nBelt Boundary Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 40, w: 400, h: 12 },
                { label: 'Arable\nFarmland (West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 60, w: 195, h: 130 },
                { label: 'Arable\nFarmland (East)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 60, w: 195, h: 130 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 198, w: 400, h: 10 },
                { label: 'Hedgerows\n& Footpaths', color: '#d1fae5', textColor: '#065f46', x: 0, y: 216, w: 195, h: 60 },
                { label: 'Woodland\nCopse', color: '#86efac', textColor: '#166534', x: 205, y: 216, w: 195, h: 60 },
                { label: 'River\nMill', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Existing\nTown Edge', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 40 },
                { label: 'New\nAccess Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 40, w: 400, h: 12 },
                { label: 'Terraced\nHousing', color: '#fde68a', textColor: '#78350f', x: 0, y: 60, w: 195, h: 65 },
                { label: 'Detached\nHousing', color: '#fef3c7', textColor: '#78350f', x: 205, y: 60, w: 195, h: 65 },
                { label: 'Local\nPark & Play Area', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 133, w: 195, h: 57 },
                { label: 'Primary\nSchool', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 133, w: 195, h: 57 },
                { label: 'Spine\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 198, w: 400, h: 10 },
                { label: 'Community\nShops & Café', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 216, w: 195, h: 60 },
                { label: 'Retained\nWoodland & Corridor', color: '#86efac', textColor: '#166534', x: 205, y: 216, w: 195, h: 60 },
                { label: 'River\nMill (restored)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
          ],
        },
      },
      // 75
      {
        title: 'City District of Northvale – Before and After Flood Alleviation Scheme',
        instruction: 'The maps below show the city district of Northvale before and after a flood alleviation scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'River\nNorth', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 30 },
                { label: 'Flood\nPlain (unprotected)', color: '#dbeafe', textColor: '#1e3a8a', x: 0, y: 30, w: 400, h: 30 },
                { label: 'Residential\nArea (at risk)', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 68, w: 195, h: 100 },
                { label: 'Industrial\nUnits (at risk)', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 68, w: 195, h: 100 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 176, w: 400, h: 12 },
                { label: 'Town\nCentre', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 196, w: 195, h: 70 },
                { label: 'Recreation\nGround', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 196, w: 195, h: 70 },
                { label: 'Southern\nResidential Area', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'River\nNorth', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 30 },
                { label: 'Flood\nBerm & Wetland', color: '#d1fae5', textColor: '#065f46', x: 0, y: 30, w: 400, h: 30 },
                { label: 'Residential\nArea (protected)', color: '#fde68a', textColor: '#78350f', x: 0, y: 68, w: 195, h: 100 },
                { label: 'Mixed\nBusiness Park', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 68, w: 195, h: 100 },
                { label: 'Main\nRoad (raised)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 176, w: 400, h: 12 },
                { label: 'Town\nCentre (expanded)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 196, w: 195, h: 70 },
                { label: 'Flood\nStorage Basin & Park', color: '#bfdbfe', textColor: '#1e40af', x: 205, y: 196, w: 195, h: 70 },
                { label: 'Southern\nResidential Area', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
          ],
        },
      },
      // 76
      {
        title: 'Seaside Resort of Beachport – Before and After Winter Tourism Initiative',
        instruction: 'The maps below show the seaside resort of Beachport before and after a winter tourism initiative. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 45 },
                { label: 'Promenade', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 45, w: 400, h: 15 },
                { label: 'Beach\nHuts (seasonal)', color: '#fde68a', textColor: '#78350f', x: 0, y: 68, w: 195, h: 50 },
                { label: 'Pier\n(closed in winter)', color: '#6b7280', textColor: '#f9fafb', x: 205, y: 68, w: 195, h: 50 },
                { label: 'Seasonal\nIce Cream & Amusements', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 126, w: 400, h: 50 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 184, w: 400, h: 12 },
                { label: 'Hotels\n(mostly shut in winter)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 204, w: 195, h: 70 },
                { label: 'Residential\nArea', color: '#fde68a', textColor: '#78350f', x: 205, y: 204, w: 195, h: 70 },
                { label: 'Town\nCentre', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 45 },
                { label: 'All-Year\nPromenade & Lighting', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 45, w: 400, h: 15 },
                { label: 'Year-Round\nCafés & Art Gallery', color: '#fde68a', textColor: '#78350f', x: 0, y: 68, w: 195, h: 50 },
                { label: 'Indoor\nLeisure Centre', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 68, w: 195, h: 50 },
                { label: 'Winter\nMarket & Events Space', color: '#fef9c3', textColor: '#713f12', x: 0, y: 126, w: 400, h: 50 },
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 184, w: 400, h: 12 },
                { label: 'Boutique\nHotels & Spa', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 204, w: 195, h: 70 },
                { label: 'Residential\nArea (expanded)', color: '#fde68a', textColor: '#78350f', x: 205, y: 204, w: 195, h: 70 },
                { label: 'Town\nCentre (revitalised)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 282, w: 400, h: 18 },
              ],
            },
          ],
        },
      },
      // 77
      {
        title: 'Industrial Suburb of Millhurst – Before and After Light Industrial to Tech Campus',
        instruction: 'The maps below show the industrial suburb of Millhurst before and after its transformation into a technology campus. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1998)',
              elements: [
                { label: 'Rail\nLine', color: '#374151', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 18 },
                { label: 'Factory\nA', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 26, w: 130, h: 100 },
                { label: 'Factory\nB', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 26, w: 130, h: 100 },
                { label: 'Factory\nC', color: '#9ca3af', textColor: '#1f2937', x: 280, y: 26, w: 120, h: 100 },
                { label: 'Industrial\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 134, w: 400, h: 14 },
                { label: 'Yard &\nWarehousing', color: '#d1d5db', textColor: '#374151', x: 0, y: 156, w: 195, h: 80 },
                { label: 'Lorry\nPark', color: '#d1d5db', textColor: '#374151', x: 205, y: 156, w: 195, h: 80 },
                { label: 'Canal\n(disused)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 244, w: 400, h: 20 },
                { label: 'Wasteland', color: '#d1d5db', textColor: '#374151', x: 0, y: 272, w: 400, h: 28 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Rail\nStop (new)', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 0, w: 400, h: 18 },
                { label: 'Tech\nHQ Building', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 26, w: 130, h: 100 },
                { label: 'Co-Working\nHub', color: '#fde68a', textColor: '#78350f', x: 140, y: 26, w: 130, h: 100 },
                { label: 'R&D\nLaboratories', color: '#a5f3fc', textColor: '#164e63', x: 280, y: 26, w: 120, h: 100 },
                { label: 'Campus\nBoulevard', color: '#86efac', textColor: '#166534', x: 0, y: 134, w: 400, h: 14 },
                { label: 'Café &\nAmenities', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 156, w: 195, h: 80 },
                { label: 'Underground\nCar Park', color: '#d1d5db', textColor: '#374151', x: 205, y: 156, w: 195, h: 80 },
                { label: 'Canal\n(restored, towpath)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 244, w: 400, h: 20 },
                { label: 'Waterside\nGarden & Cycle Route', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 272, w: 400, h: 28 },
              ],
            },
          ],
        },
      },
      // 78
      {
        title: 'Mountain Resort of Snowpeak – Before and After All-Season Development',
        instruction: 'The maps below show the mountain resort of Snowpeak before and after all-season development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Mountain\nPeak & Ski Runs', color: '#e0f2fe', textColor: '#0369a1', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Ski\nLift (winter only)', color: '#9ca3af', textColor: '#1f2937', x: 175, y: 80, w: 50, h: 80 },
                { label: 'Forest\n(West)', color: '#86efac', textColor: '#166534', x: 0, y: 80, w: 170, h: 80 },
                { label: 'Forest\n(East)', color: '#86efac', textColor: '#166534', x: 230, y: 80, w: 170, h: 80 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 168, w: 400, h: 12 },
                { label: 'Ski\nLodge & Car Park', color: '#fde68a', textColor: '#78350f', x: 0, y: 188, w: 195, h: 80 },
                { label: 'Empty\nLand', color: '#d1fae5', textColor: '#065f46', x: 205, y: 188, w: 195, h: 80 },
                { label: 'Village\n& Chalets', color: '#fef3c7', textColor: '#78350f', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Mountain\nPeak, Ski & Hiking Trails', color: '#e0f2fe', textColor: '#0369a1', x: 0, y: 0, w: 400, h: 80 },
                { label: 'Gondola\n(all-season)', color: '#a5f3fc', textColor: '#164e63', x: 175, y: 80, w: 50, h: 80 },
                { label: 'Mountain\nBike Trail (West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 80, w: 170, h: 80 },
                { label: 'Zip\nLine & Adventure Park (East)', color: '#fde68a', textColor: '#78350f', x: 230, y: 80, w: 170, h: 80 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 168, w: 400, h: 12 },
                { label: 'Mountain\nHotel & Spa', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 188, w: 195, h: 80 },
                { label: 'Conference\nCentre', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 188, w: 195, h: 80 },
                { label: 'Village\n& Chalets (expanded)', color: '#fef3c7', textColor: '#78350f', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
          ],
        },
      },
      // 79
      {
        title: 'Former Textile Mill of Weaverham – Before and After Arts Quarter',
        instruction: 'The maps below show the former textile mill site of Weaverham before and after its conversion into an arts quarter. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1995)',
              elements: [
                { label: 'River\nWeave', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 28 },
                { label: 'Main\nMill Building', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 36, w: 260, h: 110 },
                { label: 'Dye\nHouse', color: '#6b7280', textColor: '#f9fafb', x: 270, y: 36, w: 130, h: 110 },
                { label: 'Mill\nYard', color: '#d1d5db', textColor: '#374151', x: 0, y: 154, w: 400, h: 40 },
                { label: 'Workers\nCottages', color: '#fde68a', textColor: '#78350f', x: 0, y: 202, w: 195, h: 80 },
                { label: 'Engine\nHouse', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 202, w: 195, h: 80 },
                { label: 'Canal\nArm', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 290, w: 400, h: 10 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'River\nWeave (restored bank)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 28 },
                { label: 'Art\nGalleries & Studios', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 36, w: 260, h: 110 },
                { label: 'Theatre\n& Performance Space', color: '#fde68a', textColor: '#78350f', x: 270, y: 36, w: 130, h: 110 },
                { label: 'Outdoor\nEvent & Market Space', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 154, w: 400, h: 40 },
                { label: 'Artisan\nShops & Cafés', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 202, w: 195, h: 80 },
                { label: 'Boutique\nHotel', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 202, w: 195, h: 80 },
                { label: 'Towpath\n& Cycle Route', color: '#86efac', textColor: '#166534', x: 0, y: 290, w: 400, h: 10 },
              ],
            },
          ],
        },
      },
      // 80
      {
        title: 'Town of Glenside – Before and After New Sports Village',
        instruction: 'The maps below show land on the outskirts of Glenside before and after the construction of a new sports village. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Town\nBoundary', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 35 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 35, w: 400, h: 12 },
                { label: 'Unused\nGrassland (West)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 55, w: 195, h: 130 },
                { label: 'Unused\nGrassland (East)', color: '#d1fae5', textColor: '#065f46', x: 205, y: 55, w: 195, h: 130 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 193, w: 400, h: 10 },
                { label: 'Hedgerows\n& Ditches', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 211, w: 400, h: 60 },
                { label: 'Farmland\n(South)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 279, w: 400, h: 21 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Town\nBoundary', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 35 },
                { label: 'Sports\nVillage Access Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 35, w: 400, h: 12 },
                { label: 'Stadium\n(multi-sport)', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 55, w: 195, h: 130 },
                { label: 'Indoor\nArena & Velodrome', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 55, w: 195, h: 130 },
                { label: 'Spine\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 193, w: 400, h: 10 },
                { label: 'Outdoor\nPitches & Running Track', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 211, w: 195, h: 60 },
                { label: 'Car\nPark & Cycle Hub', color: '#d1d5db', textColor: '#374151', x: 205, y: 211, w: 195, h: 60 },
                { label: 'Green\nBuffer & Footpath', color: '#d1fae5', textColor: '#065f46', x: 0, y: 279, w: 400, h: 21 },
              ],
            },
          ],
        },
      },
      // 81
      {
        title: 'Wetlands of Fenholm – Before and After Nature Reserve Designation',
        instruction: 'The maps below show the wetlands of Fenholm before and after their designation as a nature reserve. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1990)',
              elements: [
                { label: 'Open\nWater (East)', color: '#bfdbfe', textColor: '#1e40af', x: 260, y: 0, w: 140, h: 180 },
                { label: 'Arable\nFarmland (West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 0, w: 255, h: 100 },
                { label: 'Ditches\n& Drains', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 108, w: 255, h: 64 },
                { label: 'Fen\nGrasses (unmanaged)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 180, w: 400, h: 60 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 248, w: 400, h: 12 },
                { label: 'Farm\nBuildings', color: '#fde68a', textColor: '#78350f', x: 0, y: 268, w: 130, h: 32 },
                { label: 'Open\nLand', color: '#d1fae5', textColor: '#065f46', x: 140, y: 268, w: 260, h: 32 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Open\nWater (managed)', color: '#bfdbfe', textColor: '#1e40af', x: 260, y: 0, w: 140, h: 180 },
                { label: 'Reed\nBeds & Habitat Zones', color: '#d1fae5', textColor: '#065f46', x: 0, y: 0, w: 255, h: 100 },
                { label: 'Boardwalk\n& Bird Hides', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 108, w: 255, h: 64 },
                { label: 'Managed\nFen Grassland', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 180, w: 400, h: 60 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 248, w: 400, h: 12 },
                { label: 'Visitor\nCentre & Car Park', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 268, w: 195, h: 32 },
                { label: 'Nature\nTrail & Picnic Area', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 268, w: 195, h: 32 },
              ],
            },
          ],
        },
      },
      // 82
      {
        title: 'Riverside Town of Bridgeton – Before and After Bridge Replacement',
        instruction: 'The maps below show the riverside town of Bridgeton before and after the replacement of its main bridge. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2002)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 70 },
                { label: 'Narrow\nOld Bridge', color: '#6b7280', textColor: '#f9fafb', x: 170, y: 70, w: 60, h: 40 },
                { label: 'River\nBridge', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 78, w: 165, h: 24 },
                { label: 'River\nBridge', color: '#bfdbfe', textColor: '#1e40af', x: 235, y: 78, w: 165, h: 24 },
                { label: 'Town\nCentre (South)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 118, w: 400, h: 80 },
                { label: 'High\nStreet', color: '#9ca3af', textColor: '#1f2937', x: 190, y: 206, w: 20, h: 60 },
                { label: 'Shops\n(West)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 206, w: 185, h: 60 },
                { label: 'Car\nPark', color: '#d1d5db', textColor: '#374151', x: 215, y: 206, w: 185, h: 60 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Residential\nArea (North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 70 },
                { label: 'New\nWide Bridge (dual carriageway)', color: '#9ca3af', textColor: '#1f2937', x: 120, y: 70, w: 160, h: 40 },
                { label: 'River\n(West)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 78, w: 115, h: 24 },
                { label: 'River\n(East)', color: '#bfdbfe', textColor: '#1e40af', x: 285, y: 78, w: 115, h: 24 },
                { label: 'Town\nCentre (South)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 118, w: 400, h: 80 },
                { label: 'Pedestrian\nBridge', color: '#86efac', textColor: '#166534', x: 0, y: 206, w: 185, h: 30 },
                { label: 'Riverside\nWalk & Seating', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 244, w: 185, h: 22 },
                { label: 'New\nRetail Quarter', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 206, w: 195, h: 60 },
                { label: 'Residential\nArea (South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
          ],
        },
      },
      // 83
      {
        title: 'Former Racecourse of Gallowfield – Before and After Housing Development',
        instruction: 'The maps below show the former racecourse at Gallowfield before and after it was converted into a housing development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1998)',
              elements: [
                { label: 'Grandstand', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Oval\nRacetrack', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 68, w: 400, h: 130 },
                { label: 'Stable\nBlock (West)', color: '#fde68a', textColor: '#78350f', x: 0, y: 206, w: 195, h: 60 },
                { label: 'Car\nPark (East)', color: '#d1d5db', textColor: '#374151', x: 205, y: 206, w: 195, h: 60 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 274, w: 400, h: 12 },
                { label: 'Paddock\n& Pasture', color: '#d1fae5', textColor: '#065f46', x: 0, y: 294, w: 400, h: 6 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Converted\nApartments (former grandstand)', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Central\nPark (former track)', color: '#bbf7d0', textColor: '#14532d', x: 80, y: 68, w: 240, h: 130 },
                { label: 'Terraced\nHousing (inner)', color: '#fde68a', textColor: '#78350f', x: 0, y: 68, w: 75, h: 130 },
                { label: 'Terraced\nHousing (inner)', color: '#fde68a', textColor: '#78350f', x: 325, y: 68, w: 75, h: 130 },
                { label: 'Detached\nHousing (West)', color: '#fef3c7', textColor: '#78350f', x: 0, y: 206, w: 195, h: 60 },
                { label: 'Community\nCentre & Shops', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 206, w: 195, h: 60 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 274, w: 400, h: 12 },
                { label: 'Cycle\nPath & Footway', color: '#86efac', textColor: '#166534', x: 0, y: 290, w: 400, h: 10 },
              ],
            },
          ],
        },
      },
      // 84
      {
        title: 'Village of Stoneford – Before and After New Primary School',
        instruction: 'The maps below show the village of Stoneford before and after the construction of a new primary school. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2008)',
              elements: [
                { label: 'Village\nChurch', color: '#e9d5ff', textColor: '#5b21b6', x: 0, y: 0, w: 130, h: 90 },
                { label: 'Village\nGreen', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 0, w: 120, h: 90 },
                { label: 'Village\nShops', color: '#fed7aa', textColor: '#7c2d12', x: 270, y: 0, w: 130, h: 90 },
                { label: 'High\nStreet', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 98, w: 400, h: 12 },
                { label: 'Empty\nField (council-owned)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 118, w: 195, h: 100 },
                { label: 'Residential\nHouses', color: '#fde68a', textColor: '#78350f', x: 205, y: 118, w: 195, h: 100 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 226, w: 400, h: 10 },
                { label: 'Allotments', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 244, w: 195, h: 56 },
                { label: 'Car\nPark (village hall)', color: '#d1d5db', textColor: '#374151', x: 205, y: 244, w: 195, h: 56 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Village\nChurch', color: '#e9d5ff', textColor: '#5b21b6', x: 0, y: 0, w: 130, h: 90 },
                { label: 'Village\nGreen', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 0, w: 120, h: 90 },
                { label: 'Village\nShops', color: '#fed7aa', textColor: '#7c2d12', x: 270, y: 0, w: 130, h: 90 },
                { label: 'High\nStreet', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 98, w: 400, h: 12 },
                { label: 'New\nPrimary School', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 118, w: 195, h: 100 },
                { label: 'Residential\nHouses', color: '#fde68a', textColor: '#78350f', x: 205, y: 118, w: 195, h: 100 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 226, w: 400, h: 10 },
                { label: 'School\nSports Field', color: '#d1fae5', textColor: '#065f46', x: 0, y: 244, w: 195, h: 56 },
                { label: 'School\nCar Park', color: '#d1d5db', textColor: '#374151', x: 205, y: 244, w: 195, h: 56 },
              ],
            },
          ],
        },
      },
      // 85
      {
        title: 'Clifftop Area of Whitecliff – Before and After National Trust Management',
        instruction: 'The maps below show the clifftop area of Whitecliff before and after it was taken over by the National Trust for conservation management. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Sea\n& Cliff Edge', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Unmanaged\nScrubland', color: '#d1fae5', textColor: '#065f46', x: 0, y: 40, w: 400, h: 100 },
                { label: 'Disused\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 148, w: 195, h: 60 },
                { label: 'Derelict\nCafé Building', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 148, w: 195, h: 60 },
                { label: 'Coastal\nPath (poorly maintained)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 216, w: 400, h: 12 },
                { label: 'Privately\nOwned Fields', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 236, w: 400, h: 64 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea\n& Cliff Edge (fenced)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 40 },
                { label: 'Chalk\nGrassland & Wildflower Meadow', color: '#d1fae5', textColor: '#065f46', x: 0, y: 40, w: 400, h: 100 },
                { label: 'Visitor\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 148, w: 195, h: 60 },
                { label: 'Restored\nVisitor Café & Info Point', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 148, w: 195, h: 60 },
                { label: 'Signed\nCoastal Path', color: '#86efac', textColor: '#166534', x: 0, y: 216, w: 400, h: 12 },
                { label: 'NT\nProtected Farmland', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 236, w: 195, h: 64 },
                { label: 'Grazing\nMeadow (conservation)', color: '#d1fae5', textColor: '#065f46', x: 205, y: 236, w: 195, h: 64 },
              ],
            },
          ],
        },
      },
      // 86
      {
        title: 'Town of Dewford – Before and After New Leisure Waterpark',
        instruction: 'The maps below show land in the town of Dewford before and after the construction of a new leisure waterpark. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2008)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Disused\nSuperstore', color: '#d1d5db', textColor: '#374151', x: 0, y: 22, w: 400, h: 100 },
                { label: 'Lorry\nYard', color: '#d1d5db', textColor: '#374151', x: 0, y: 130, w: 400, h: 50 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 188, w: 400, h: 12 },
                { label: 'Car\nPark (surface)', color: '#d1d5db', textColor: '#374151', x: 0, y: 208, w: 400, h: 60 },
                { label: 'Wasteland\n& Scrub', color: '#d1fae5', textColor: '#065f46', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Waterpark\nIndoor Pools & Slides', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 22, w: 260, h: 100 },
                { label: 'Changing\n& Leisure Facilities', color: '#a5f3fc', textColor: '#164e63', x: 270, y: 22, w: 130, h: 100 },
                { label: 'Outdoor\nPool & Lazy River', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 130, w: 195, h: 50 },
                { label: 'Restaurant\n& Retail', color: '#fde68a', textColor: '#78350f', x: 205, y: 130, w: 195, h: 50 },
                { label: 'Access\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 188, w: 400, h: 12 },
                { label: 'Multi-Storey\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 208, w: 195, h: 60 },
                { label: 'Landscaped\nGarden & Seating', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 208, w: 195, h: 60 },
                { label: 'Green\nPerimeter Planting', color: '#d1fae5', textColor: '#065f46', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
          ],
        },
      },
      // 87
      {
        title: 'Estate Village of Hartwood – Before and After Opening of Stately Home',
        instruction: 'The maps below show the estate village of Hartwood before and after the stately home was opened to the public. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1990)',
              elements: [
                { label: 'Stately\nHome (private)', color: '#fde68a', textColor: '#78350f', x: 120, y: 0, w: 160, h: 80 },
                { label: 'Private\nGardens', color: '#d1fae5', textColor: '#065f46', x: 0, y: 0, w: 115, h: 80 },
                { label: 'Private\nGardens', color: '#d1fae5', textColor: '#065f46', x: 285, y: 0, w: 115, h: 80 },
                { label: 'Estate\nWall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 88, w: 400, h: 10 },
                { label: 'Estate\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 106, w: 400, h: 12 },
                { label: 'Estate\nCottages', color: '#fef3c7', textColor: '#78350f', x: 0, y: 126, w: 130, h: 80 },
                { label: 'Home\nFarm', color: '#bbf7d0', textColor: '#14532d', x: 140, y: 126, w: 120, h: 80 },
                { label: 'Village\nPub & Church', color: '#e9d5ff', textColor: '#5b21b6', x: 270, y: 126, w: 130, h: 80 },
                { label: 'Pasture\nLand', color: '#d1fae5', textColor: '#065f46', x: 0, y: 214, w: 400, h: 86 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Stately\nHome (open to visitors)', color: '#fde68a', textColor: '#78350f', x: 120, y: 0, w: 160, h: 80 },
                { label: 'Formal\nGardens (public)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 0, w: 115, h: 80 },
                { label: 'Walled\nKitchen Garden', color: '#bbf7d0', textColor: '#14532d', x: 285, y: 0, w: 115, h: 80 },
                { label: 'Estate\nWall', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 88, w: 400, h: 10 },
                { label: 'Visitor\nAccess Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 106, w: 400, h: 12 },
                { label: 'Visitor\nCentre & Gift Shop', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 126, w: 130, h: 80 },
                { label: 'Café\n& Events Barn', color: '#fca5a5', textColor: '#7f1d1d', x: 140, y: 126, w: 120, h: 80 },
                { label: 'Village\nPub & Church', color: '#e9d5ff', textColor: '#5b21b6', x: 270, y: 126, w: 130, h: 80 },
                { label: 'Car\nPark & Coach Bay', color: '#d1d5db', textColor: '#374151', x: 0, y: 214, w: 195, h: 86 },
                { label: 'Deer\nPark & Walking Trail', color: '#d1fae5', textColor: '#065f46', x: 205, y: 214, w: 195, h: 86 },
              ],
            },
          ],
        },
      },
      // 88
      {
        title: 'Brownfield Land of Eastgate – Before and After Mixed-Use Scheme',
        instruction: 'The maps below show brownfield land in the Eastgate area before and after a mixed-use development scheme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2003)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Derelict\nWarehouse A', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 22, w: 195, h: 90 },
                { label: 'Derelict\nWarehouse B', color: '#9ca3af', textColor: '#1f2937', x: 205, y: 22, w: 195, h: 90 },
                { label: 'Contaminated\nGround', color: '#d1d5db', textColor: '#374151', x: 0, y: 120, w: 400, h: 70 },
                { label: 'Old\nSewer Works', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 198, w: 195, h: 60 },
                { label: 'Fly-Tipping\nSite', color: '#d1d5db', textColor: '#374151', x: 205, y: 198, w: 195, h: 60 },
                { label: 'Back\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 266, w: 400, h: 10 },
                { label: 'Residential\nStreet', color: '#fde68a', textColor: '#78350f', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Main\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 15 },
                { label: 'Apartment\nBlock A', color: '#c4b5fd', textColor: '#5b21b6', x: 0, y: 22, w: 195, h: 90 },
                { label: 'Office\n& Co-Working Space', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 22, w: 195, h: 90 },
                { label: 'Central\nPark & Cycle Path', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 120, w: 400, h: 70 },
                { label: 'Ground\nFloor Retail', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 198, w: 195, h: 60 },
                { label: 'Café\n& Community Space', color: '#fde68a', textColor: '#78350f', x: 205, y: 198, w: 195, h: 60 },
                { label: 'Shared\nSurface Lane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 266, w: 400, h: 10 },
                { label: 'Residential\nStreet', color: '#fde68a', textColor: '#78350f', x: 0, y: 284, w: 400, h: 16 },
              ],
            },
          ],
        },
      },
      // 89
      {
        title: 'Seaside Village of Coppice Bay – Before and After Erosion Management',
        instruction: 'The maps below show the seaside village of Coppice Bay before and after coastal erosion management works. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2000)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Eroded\nBeach & Cliff', color: '#fef9c3', textColor: '#713f12', x: 0, y: 50, w: 400, h: 40 },
                { label: 'Beach\nRoad (at risk)', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 98, w: 400, h: 12 },
                { label: 'Seafront\nHouses (threatened)', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 118, w: 195, h: 70 },
                { label: 'Beach\nCafé & Amusements', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 118, w: 195, h: 70 },
                { label: 'Main\nVillage Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 196, w: 400, h: 12 },
                { label: 'Village\nHouses', color: '#fde68a', textColor: '#78350f', x: 0, y: 216, w: 195, h: 84 },
                { label: 'Pub\n& Village Hall', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 216, w: 195, h: 84 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Rock\nArmour & Beach Nourishment', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 50, w: 400, h: 40 },
                { label: 'Raised\nSeawall Promenade', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 98, w: 400, h: 12 },
                { label: 'Seafront\nHouses (protected)', color: '#fde68a', textColor: '#78350f', x: 0, y: 118, w: 195, h: 70 },
                { label: 'Beach\nCafé & Amusements', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 118, w: 195, h: 70 },
                { label: 'Main\nVillage Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 196, w: 400, h: 12 },
                { label: 'Village\nHouses', color: '#fde68a', textColor: '#78350f', x: 0, y: 216, w: 195, h: 84 },
                { label: 'New\nCommunity Centre', color: '#a7f3d0', textColor: '#065f46', x: 205, y: 216, w: 195, h: 84 },
              ],
            },
          ],
        },
      },
      // 90
      {
        title: 'Former Airforce Base of Wingfield – Before and After Business Park',
        instruction: 'The maps below show the former airforce base at Wingfield before and after its conversion into a business park. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1992)',
              elements: [
                { label: 'Runway\n(disused)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 25 },
                { label: 'Hangar\nA', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 33, w: 130, h: 90 },
                { label: 'Hangar\nB', color: '#6b7280', textColor: '#f9fafb', x: 140, y: 33, w: 130, h: 90 },
                { label: 'Control\nTower', color: '#374151', textColor: '#f9fafb', x: 280, y: 33, w: 120, h: 90 },
                { label: 'Military\nRoad', color: '#374151', textColor: '#f9fafb', x: 0, y: 131, w: 400, h: 14 },
                { label: 'Barracks\n& Offices', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 153, w: 195, h: 80 },
                { label: 'Fuel\nDepot', color: '#6b7280', textColor: '#f9fafb', x: 205, y: 153, w: 195, h: 80 },
                { label: 'Perimeter\nFence', color: '#374151', textColor: '#f9fafb', x: 0, y: 241, w: 400, h: 14 },
                { label: 'Buffer\nZone', color: '#d1d5db', textColor: '#374151', x: 0, y: 263, w: 400, h: 37 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Main\nAccess Road (former runway)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 25 },
                { label: 'Business\nUnits A (former hangar)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 33, w: 130, h: 90 },
                { label: 'Business\nUnits B (former hangar)', color: '#fde68a', textColor: '#78350f', x: 140, y: 33, w: 130, h: 90 },
                { label: 'Heritage\nVisitor Centre (control tower)', color: '#fca5a5', textColor: '#7f1d1d', x: 280, y: 33, w: 120, h: 90 },
                { label: 'Business\nPark Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 131, w: 400, h: 14 },
                { label: 'Office\nSuites', color: '#a5f3fc', textColor: '#164e63', x: 0, y: 153, w: 195, h: 80 },
                { label: 'Car\nPark & EV Charging', color: '#d1d5db', textColor: '#374151', x: 205, y: 153, w: 195, h: 80 },
                { label: 'Security\nGate', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 241, w: 400, h: 14 },
                { label: 'Landscaped\nGreen Buffer', color: '#d1fae5', textColor: '#065f46', x: 0, y: 263, w: 400, h: 37 },
              ],
            },
          ],
        },
      },
      // 91
      {
        title: 'Shopping Centre of Queensgate (2000 vs 2022)',
        instruction: 'The maps below show the Queensgate shopping centre in 2000 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '2000',
              elements: [
                { label: 'Main\nEntrance (North)', color: '#fca5a5', textColor: '#7f1d1d', x: 150, y: 0, w: 100, h: 20 },
                { label: 'Department\nStore A', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 28, w: 195, h: 100 },
                { label: 'Department\nStore B', color: '#fde68a', textColor: '#78350f', x: 205, y: 28, w: 195, h: 100 },
                { label: 'Mall\nCorridor', color: '#d1d5db', textColor: '#374151', x: 0, y: 136, w: 400, h: 20 },
                { label: 'Food\nCourt', color: '#fef9c3', textColor: '#713f12', x: 0, y: 164, w: 195, h: 80 },
                { label: 'Shops\n& Banks', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 164, w: 195, h: 80 },
                { label: 'Rear\nService Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 252, w: 400, h: 12 },
                { label: 'Car\nPark (surface, South)', color: '#d1d5db', textColor: '#374151', x: 0, y: 272, w: 400, h: 28 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Main\nEntrance & Canopy', color: '#fca5a5', textColor: '#7f1d1d', x: 100, y: 0, w: 200, h: 20 },
                { label: 'Anchor\nStore (fashion)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 28, w: 195, h: 100 },
                { label: 'Cinema\n& Entertainment', color: '#c4b5fd', textColor: '#5b21b6', x: 205, y: 28, w: 195, h: 100 },
                { label: 'Mall\nCorridor (redesigned)', color: '#d1d5db', textColor: '#374151', x: 0, y: 136, w: 400, h: 20 },
                { label: 'Restaurant\nQuarter', color: '#fde68a', textColor: '#78350f', x: 0, y: 164, w: 195, h: 80 },
                { label: 'Shops\n& Health & Beauty', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 164, w: 195, h: 80 },
                { label: 'Rear\nService Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 252, w: 400, h: 12 },
                { label: 'Multi-Storey\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 272, w: 195, h: 28 },
                { label: 'Delivery\nHub', color: '#6b7280', textColor: '#f9fafb', x: 205, y: 272, w: 195, h: 28 },
              ],
            },
          ],
        },
      },
      // 92
      {
        title: 'Old Town of Ravensford – Before and After Heritage Conservation',
        instruction: 'The maps below show the old town of Ravensford before and after a heritage conservation programme. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1995)',
              elements: [
                { label: 'Castle\nRuins', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 0, w: 120, h: 70 },
                { label: 'Derelict\nOld Town Houses (West)', color: '#d1d5db', textColor: '#374151', x: 0, y: 0, w: 135, h: 70 },
                { label: 'Derelict\nOld Town Houses (East)', color: '#d1d5db', textColor: '#374151', x: 265, y: 0, w: 135, h: 70 },
                { label: 'Cobbled\nHigh Street', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 78, w: 400, h: 12 },
                { label: 'Empty\nShops & Pubs', color: '#d1d5db', textColor: '#374151', x: 0, y: 98, w: 195, h: 80 },
                { label: 'Market\nSquare (neglected)', color: '#d1d5db', textColor: '#374151', x: 205, y: 98, w: 195, h: 80 },
                { label: 'Town\nWalls (damaged)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 186, w: 400, h: 14 },
                { label: 'Car\nPark (informal)', color: '#d1d5db', textColor: '#374151', x: 0, y: 208, w: 195, h: 92 },
                { label: 'Waste\nGround', color: '#d1d5db', textColor: '#374151', x: 205, y: 208, w: 195, h: 92 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Castle\n(restored visitor attraction)', color: '#fca5a5', textColor: '#7f1d1d', x: 140, y: 0, w: 120, h: 70 },
                { label: 'Restored\nMedieval Houses (museum)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 135, h: 70 },
                { label: 'Restored\nHeritage Shops & Flats', color: '#fef3c7', textColor: '#78350f', x: 265, y: 0, w: 135, h: 70 },
                { label: 'Cobbled\nHigh Street (repaved)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 78, w: 400, h: 12 },
                { label: 'Independent\nShops & Cafés', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 98, w: 195, h: 80 },
                { label: 'Heritage\nMarket Square', color: '#fef9c3', textColor: '#713f12', x: 205, y: 98, w: 195, h: 80 },
                { label: 'Restored\nTown Walls (tourist trail)', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 186, w: 400, h: 14 },
                { label: 'Visitor\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 208, w: 195, h: 92 },
                { label: 'Public\nGarden & Amphitheatre', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 208, w: 195, h: 92 },
              ],
            },
          ],
        },
      },
      // 93
      {
        title: 'Island of Westmere – Before and After Eco-Tourism Development',
        instruction: 'The maps below show the island of Westmere before and after eco-tourism development. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Sea\n(North)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 30 },
                { label: 'Woodland\n(North)', color: '#86efac', textColor: '#166534', x: 0, y: 30, w: 400, h: 80 },
                { label: 'Farm\nLand (centre)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Ruins\n& Heathland', color: '#d1fae5', textColor: '#065f46', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Sandy\nBeach (South)', color: '#fef9c3', textColor: '#713f12', x: 0, y: 206, w: 400, h: 30 },
                { label: 'Sea\n(South)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 244, w: 400, h: 56 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea\n(North)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 30 },
                { label: 'Eco\nLodges (boardwalk)', color: '#fde68a', textColor: '#78350f', x: 0, y: 30, w: 195, h: 80 },
                { label: 'Guided\nNature Trail', color: '#d1fae5', textColor: '#065f46', x: 205, y: 30, w: 195, h: 80 },
                { label: 'Community\nFarm & Produce Shop', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 118, w: 195, h: 80 },
                { label: 'Ruins\nVisitor Trail', color: '#fef9c3', textColor: '#713f12', x: 205, y: 118, w: 195, h: 80 },
                { label: 'Beach\n& Water Sports Hub', color: '#93c5fd', textColor: '#1e3a8a', x: 0, y: 206, w: 195, h: 30 },
                { label: 'Kayak\n& Snorkel Hire', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 206, w: 195, h: 30 },
                { label: 'Sea\n(South)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 244, w: 400, h: 56 },
              ],
            },
          ],
        },
      },
      // 94
      {
        title: 'Town Centre of Copperfield – Before and After Cycle Network',
        instruction: 'The maps below show the town centre of Copperfield before and after the introduction of a new cycle network. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Residential\n(North)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Town\nHall & Civic Centre', color: '#e9d5ff', textColor: '#5b21b6', x: 0, y: 68, w: 195, h: 70 },
                { label: 'Shopping\nArea', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 68, w: 195, h: 70 },
                { label: 'Main\nRoad (cars only)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 146, w: 400, h: 18 },
                { label: 'Market\nSquare (car park)', color: '#d1d5db', textColor: '#374151', x: 0, y: 172, w: 195, h: 80 },
                { label: 'Offices\n& Banks', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 172, w: 195, h: 80 },
                { label: 'Bypass\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 260, w: 400, h: 12 },
                { label: 'Residential\n(South)', color: '#fde68a', textColor: '#78350f', x: 0, y: 280, w: 400, h: 20 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Residential\n(North, cycle access)', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 60 },
                { label: 'Town\nHall (cycle parking outside)', color: '#e9d5ff', textColor: '#5b21b6', x: 0, y: 68, w: 195, h: 70 },
                { label: 'Shopping\nArea (cycle route through)', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 68, w: 195, h: 70 },
                { label: 'Shared\nCycle & Bus Lane', color: '#86efac', textColor: '#166534', x: 0, y: 146, w: 400, h: 18 },
                { label: 'Market\nSquare (pedestrianised)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 172, w: 195, h: 80 },
                { label: 'Offices\n& Cycle Hub', color: '#a5f3fc', textColor: '#164e63', x: 205, y: 172, w: 195, h: 80 },
                { label: 'Bypass\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 260, w: 400, h: 12 },
                { label: 'Residential\n(South, cycle access)', color: '#fde68a', textColor: '#78350f', x: 0, y: 280, w: 400, h: 20 },
              ],
            },
          ],
        },
      },
      // 95
      {
        title: 'Lakeland District of Mirewater (1980 vs 2022)',
        instruction: 'The maps below show the lakeland district of Mirewater in 1980 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1980',
              elements: [
                { label: 'Lake\nMire', color: '#bfdbfe', textColor: '#1e40af', x: 80, y: 20, w: 240, h: 140 },
                { label: 'Forest\n(West)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 75, h: 200 },
                { label: 'Forest\n(East)', color: '#86efac', textColor: '#166534', x: 325, y: 0, w: 75, h: 200 },
                { label: 'Heather\nMoor (North)', color: '#d1fae5', textColor: '#065f46', x: 80, y: 0, w: 240, h: 15 },
                { label: 'Bog\n& Fen (South)', color: '#d1fae5', textColor: '#065f46', x: 80, y: 168, w: 240, h: 32 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 208, w: 400, h: 12 },
                { label: 'Farm\nLand', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 228, w: 195, h: 72 },
                { label: 'Village\n(Mirewater)', color: '#fde68a', textColor: '#78350f', x: 205, y: 228, w: 195, h: 72 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Lake\nMire', color: '#bfdbfe', textColor: '#1e40af', x: 80, y: 20, w: 240, h: 140 },
                { label: 'Forest\nWalk (West)', color: '#86efac', textColor: '#166534', x: 0, y: 0, w: 75, h: 200 },
                { label: 'Cycle\nRoute (East)', color: '#bbf7d0', textColor: '#14532d', x: 325, y: 0, w: 75, h: 200 },
                { label: 'Jetty\n& Boat Hire', color: '#93c5fd', textColor: '#1e3a8a', x: 80, y: 0, w: 240, h: 15 },
                { label: 'Nature\nReserve & Boardwalk', color: '#d1fae5', textColor: '#065f46', x: 80, y: 168, w: 240, h: 32 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 208, w: 400, h: 12 },
                { label: 'Holiday\nParks & Glamping', color: '#fef3c7', textColor: '#78350f', x: 0, y: 228, w: 195, h: 72 },
                { label: 'Village\n(expanded, B&Bs & café)', color: '#fde68a', textColor: '#78350f', x: 205, y: 228, w: 195, h: 72 },
              ],
            },
          ],
        },
      },
      // 96
      {
        title: 'Town of Ashwick – Before and After Bypass Construction',
        instruction: 'The maps below show the town of Ashwick before and after the construction of a bypass road. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (1998)',
              elements: [
                { label: 'Farmland\n(North-West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 0, w: 195, h: 90 },
                { label: 'Farmland\n(North-East)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 0, w: 195, h: 90 },
                { label: 'Through\nRoad (heavy traffic)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 98, w: 400, h: 18 },
                { label: 'Town\nCentre (congested)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 124, w: 195, h: 80 },
                { label: 'Residential\nArea', color: '#fde68a', textColor: '#78350f', x: 205, y: 124, w: 195, h: 80 },
                { label: 'South\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 212, w: 400, h: 12 },
                { label: 'Farmland\n(South)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 232, w: 400, h: 68 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Bypass\nRoad (North)', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 18 },
                { label: 'Farmland\n(West, reduced)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 26, w: 195, h: 64 },
                { label: 'Farmland\n(East, reduced)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 26, w: 195, h: 64 },
                { label: 'Local\nRoad (reduced traffic)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 98, w: 400, h: 18 },
                { label: 'Town\nCentre (pedestrianised)', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 124, w: 195, h: 80 },
                { label: 'New\nHousing Estate', color: '#fde68a', textColor: '#78350f', x: 205, y: 124, w: 195, h: 80 },
                { label: 'South\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 212, w: 400, h: 12 },
                { label: 'Retained\nFarmland', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 232, w: 195, h: 68 },
                { label: 'Industrial\nEstate (new)', color: '#d1d5db', textColor: '#374151', x: 205, y: 232, w: 195, h: 68 },
              ],
            },
          ],
        },
      },
      // 97
      {
        title: 'Suburban Retail Strip of Parkway – Before and After Regeneration',
        instruction: 'The maps below show the suburban retail strip of Parkway before and after regeneration. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Main\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 20 },
                { label: 'Drive-Through\nFast Food', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 28, w: 130, h: 80 },
                { label: 'Tyre\nCentre', color: '#9ca3af', textColor: '#1f2937', x: 140, y: 28, w: 120, h: 80 },
                { label: 'Vacant\nUnit', color: '#d1d5db', textColor: '#374151', x: 270, y: 28, w: 130, h: 80 },
                { label: 'Surface\nCar Park', color: '#d1d5db', textColor: '#374151', x: 0, y: 116, w: 400, h: 70 },
                { label: 'Betting\nShop', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 194, w: 100, h: 60 },
                { label: 'Payday\nLoan Shop', color: '#9ca3af', textColor: '#1f2937', x: 110, y: 194, w: 100, h: 60 },
                { label: 'Charity\nShop', color: '#9ca3af', textColor: '#1f2937', x: 220, y: 194, w: 100, h: 60 },
                { label: 'Phone\nRepair', color: '#9ca3af', textColor: '#1f2937', x: 330, y: 194, w: 70, h: 60 },
                { label: 'Residential\nStreet', color: '#fde68a', textColor: '#78350f', x: 0, y: 262, w: 400, h: 38 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Main\nRoad', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 0, w: 400, h: 20 },
                { label: 'Independent\nCafé & Bakery', color: '#fde68a', textColor: '#78350f', x: 0, y: 28, w: 130, h: 80 },
                { label: 'Health\nCentre', color: '#a7f3d0', textColor: '#065f46', x: 140, y: 28, w: 120, h: 80 },
                { label: 'Co-Working\nSpace', color: '#a5f3fc', textColor: '#164e63', x: 270, y: 28, w: 130, h: 80 },
                { label: 'Pocket\nPark & Seating', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 116, w: 195, h: 70 },
                { label: 'Cycle\nPark & EV Charging', color: '#86efac', textColor: '#166534', x: 205, y: 116, w: 195, h: 70 },
                { label: 'Artisan\nShops & Gallery', color: '#fed7aa', textColor: '#7c2d12', x: 0, y: 194, w: 195, h: 60 },
                { label: 'Community\nHub & Library', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 194, w: 195, h: 60 },
                { label: 'Residential\nStreet', color: '#fde68a', textColor: '#78350f', x: 0, y: 262, w: 400, h: 38 },
              ],
            },
          ],
        },
      },
      // 98
      {
        title: 'Urban Fringe Area of Greendale (1990 vs 2022)',
        instruction: 'The maps below show an urban fringe area of Greendale in 1990 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: '1990',
              elements: [
                { label: 'Town\nEdge Housing', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Urban\nEdge Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 50, w: 400, h: 14 },
                { label: 'Market\nGarden', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 72, w: 195, h: 90 },
                { label: 'Traveller\nSite', color: '#d1d5db', textColor: '#374151', x: 205, y: 72, w: 195, h: 90 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 170, w: 400, h: 10 },
                { label: 'Rough\nGrazing Land', color: '#d1fae5', textColor: '#065f46', x: 0, y: 188, w: 195, h: 80 },
                { label: 'Derelict\nGlasshouses', color: '#d1d5db', textColor: '#374151', x: 205, y: 188, w: 195, h: 80 },
                { label: 'Footpath\n& Hedgerow', color: '#86efac', textColor: '#166534', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
            {
              label: '2022',
              elements: [
                { label: 'Town\nEdge Housing', color: '#fde68a', textColor: '#78350f', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Urban\nEdge Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 50, w: 400, h: 14 },
                { label: 'New\nHousing (Phase 1)', color: '#fef3c7', textColor: '#78350f', x: 0, y: 72, w: 195, h: 90 },
                { label: 'New\nHousing (Phase 2)', color: '#fde68a', textColor: '#78350f', x: 205, y: 72, w: 195, h: 90 },
                { label: 'New\nSpine Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 170, w: 400, h: 10 },
                { label: 'Primary\nSchool', color: '#a7f3d0', textColor: '#065f46', x: 0, y: 188, w: 195, h: 80 },
                { label: 'Local\nShops & Café', color: '#fed7aa', textColor: '#7c2d12', x: 205, y: 188, w: 195, h: 80 },
                { label: 'Linear\nPark & Cycle Route', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 276, w: 400, h: 24 },
              ],
            },
          ],
        },
      },
      // 99
      {
        title: 'Coastal Headland of Stormhaven – Before and After Wind Turbine Development',
        instruction: 'The maps below show the coastal headland of Stormhaven before and after the construction of offshore wind turbines and onshore infrastructure. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Sea\n(North)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Cliff\nPath', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 50, w: 400, h: 10 },
                { label: 'Heathland\n(West)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 68, w: 195, h: 100 },
                { label: 'Agricultural\nLand (East)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 68, w: 195, h: 100 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 176, w: 400, h: 12 },
                { label: 'Farmhouse\n& Barns', color: '#fde68a', textColor: '#78350f', x: 0, y: 196, w: 195, h: 70 },
                { label: 'Open\nLand', color: '#d1fae5', textColor: '#065f46', x: 205, y: 196, w: 195, h: 70 },
                { label: 'Small\nVillage', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Sea\n(offshore turbines)', color: '#bfdbfe', textColor: '#1e40af', x: 0, y: 0, w: 400, h: 50 },
                { label: 'Cliff\nPath (retained)', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 50, w: 400, h: 10 },
                { label: 'Heathland\n(conservation zone)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 68, w: 195, h: 100 },
                { label: 'Substation\n& Grid Cables', color: '#fca5a5', textColor: '#7f1d1d', x: 205, y: 68, w: 195, h: 100 },
                { label: 'Country\nRoad', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 176, w: 400, h: 12 },
                { label: 'Cable\nLanding Station', color: '#6b7280', textColor: '#f9fafb', x: 0, y: 196, w: 195, h: 70 },
                { label: 'Landscaped\nBuffer & Bund', color: '#d1fae5', textColor: '#065f46', x: 205, y: 196, w: 195, h: 70 },
                { label: 'Village\n(visitor info point)', color: '#fde68a', textColor: '#78350f', x: 0, y: 274, w: 400, h: 26 },
              ],
            },
          ],
        },
      },
      // 100
      {
        title: 'Town of Millvale – Before and After New Hospital Campus',
        instruction: 'The maps below show land on the edge of Millvale before and after the construction of a new hospital campus. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'map',
          viewBox: '0 0 400 300',
          periods: [
            {
              label: 'Before (2005)',
              elements: [
                { label: 'Town\nEdge Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 16 },
                { label: 'Arable\nFarmland (West)', color: '#bbf7d0', textColor: '#14532d', x: 0, y: 24, w: 195, h: 120 },
                { label: 'Arable\nFarmland (East)', color: '#bbf7d0', textColor: '#14532d', x: 205, y: 24, w: 195, h: 120 },
                { label: 'Farm\nTrack', color: '#9ca3af', textColor: '#1f2937', x: 190, y: 152, w: 20, h: 70 },
                { label: 'Pasture\n(West)', color: '#d1fae5', textColor: '#065f46', x: 0, y: 152, w: 185, h: 70 },
                { label: 'Pasture\n(East)', color: '#d1fae5', textColor: '#065f46', x: 215, y: 152, w: 185, h: 70 },
                { label: 'Country\nLane', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 230, w: 400, h: 10 },
                { label: 'Hedgerows\n& Ditches', color: '#86efac', textColor: '#166534', x: 0, y: 248, w: 400, h: 52 },
              ],
            },
            {
              label: 'After (2022)',
              elements: [
                { label: 'Town\nEdge Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 0, w: 400, h: 16 },
                { label: 'Hospital\nMain Building', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 24, w: 260, h: 120 },
                { label: 'Car\nPark A', color: '#d1d5db', textColor: '#374151', x: 270, y: 24, w: 130, h: 120 },
                { label: 'Hospital\nAccess Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 152, w: 400, h: 14 },
                { label: 'Outpatient\nBlock & Pharmacy', color: '#fca5a5', textColor: '#7f1d1d', x: 0, y: 174, w: 195, h: 48 },
                { label: 'Car\nPark B & Ambulance Bay', color: '#d1d5db', textColor: '#374151', x: 205, y: 174, w: 195, h: 48 },
                { label: 'New\nAccess Road', color: '#9ca3af', textColor: '#1f2937', x: 0, y: 230, w: 400, h: 10 },
                { label: 'Retained\nGreen Buffer & Footpath', color: '#d1fae5', textColor: '#065f46', x: 0, y: 248, w: 195, h: 52 },
                { label: 'Staff\nResidence & Gardens', color: '#fde68a', textColor: '#78350f', x: 205, y: 248, w: 195, h: 52 },
              ],
            },
          ],
        },
      },
    ],
  },

  /* ═══════════════════ PROCESS DIAGRAM ═══════════════════ */
  {
    type: 'process',
    label: 'Process Diagram',
    description: 'Explain the stages of a process or how something works.',
    color: 'rose',
    prompts: [
      {
        title: 'The Process of Paper Recycling',
        instruction: 'The diagram below shows the process by which used paper is recycled and turned into new paper products. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'process',
          stages: [
            { title: 'Collection',         description: 'Used paper is collected from homes and businesses in recycling bins and transported by trucks to a recycling centre.',                icon: '🚛', color: '#dbeafe' },
            { title: 'Sorting',            description: 'Paper is sorted by type (newspaper, cardboard, office paper) and non-paper items such as plastic and staples are removed.',        icon: '📂', color: '#dcfce7' },
            { title: 'Pulping',            description: 'Sorted paper is shredded and mixed with water and chemicals in large tanks to create a wet mixture called pulp.',                    icon: '💧', color: '#e0f2fe' },
            { title: 'Cleaning & Screening', description: 'The pulp is filtered through fine screens to remove glue, staples, and other contaminants.',                                     icon: '🔬', color: '#fef9c3' },
            { title: 'De-Inking',          description: 'Air bubbles are injected into the pulp. Ink particles rise to the surface on the bubbles and are skimmed off.',                    icon: '🫧', color: '#fce7f3' },
            { title: 'Bleaching',          description: '(Optional) The pulp is bleached with hydrogen peroxide to produce bright white paper.',                                             icon: '⚗️', color: '#f3e8ff' },
            { title: 'Sheet Formation',    description: 'Clean pulp is spread onto a moving mesh screen where water drains away and fibres bond together to form a paper sheet.',           icon: '📄', color: '#fff7ed' },
            { title: 'Drying & Rolling',   description: 'The sheet passes through heated rollers to remove remaining moisture and is wound into large rolls.',                               icon: '🔄', color: '#ecfdf5' },
            { title: 'Distribution',       description: 'Finished recycled paper rolls are cut to size and shipped to manufacturers of paper products.',                                     icon: '🏭', color: '#dbeafe' },
          ],
        },
      },
      {
        title: 'The Life Cycle of a Salmon',
        instruction: 'The diagram below illustrates the complete life cycle of a salmon from egg to adult. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'process',
          stages: [
            { title: 'Spawning',             description: 'Adult salmon migrate upstream from the ocean to freshwater rivers. Females lay eggs in gravel beds; males fertilise them. Most adults die after spawning.', icon: '🐟', color: '#dbeafe' },
            { title: 'Egg Incubation',       description: 'Fertilised eggs develop inside the gravel for 6–12 weeks, depending on water temperature.',                                                                  icon: '🥚', color: '#dcfce7' },
            { title: 'Alevin',               description: 'Eggs hatch into tiny fish called alevin, which remain in the gravel and absorb nutrients from an attached yolk sac.',                                        icon: '🐡', color: '#fef9c3' },
            { title: 'Fry',                  description: 'Once the yolk sac is absorbed, the young fish (fry) emerge from the gravel and begin feeding on insects and plankton in the stream.',                        icon: '🐠', color: '#e0f2fe' },
            { title: 'Parr',                 description: 'Over 1–3 years, fry grow into parr and develop dark markings (parr marks) that camouflage them in the river.',                                               icon: '🐟', color: '#f3e8ff' },
            { title: 'Smolt',                description: 'Parr undergo physiological changes (smoltification) to adapt to saltwater and migrate downstream toward the ocean.',                                          icon: '🌊', color: '#fce7f3' },
            { title: 'Adult Ocean Phase',    description: 'Salmon spend 1–4 years at sea, growing rapidly by feeding on fish and crustaceans. They may travel thousands of kilometres.',                                icon: '🦈', color: '#dcfce7' },
            { title: 'Return Migration',     description: 'Mature adults use their sense of smell to navigate back to their birth river to spawn, completing the life cycle.',                                           icon: '🔄', color: '#dbeafe' },
          ],
        },
      },
      {
        title: 'How Solar Panels Generate and Distribute Electricity',
        instruction: 'The diagram below shows the process by which solar panels generate electricity and distribute it to homes and the national grid. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chartData: {
          type: 'process',
          stages: [
            { title: 'Sunlight Absorption',   description: 'Sunlight strikes the surface of photovoltaic (PV) cells embedded in the solar panel.',                                                              icon: '☀️', color: '#fef9c3' },
            { title: 'DC Electricity Generated', description: 'PV cells convert light energy into direct current (DC) electricity. Cells are connected in series to build up voltage.',                        icon: '⚡', color: '#fff7ed' },
            { title: 'Inverter Conversion',   description: 'DC electricity flows into an inverter, which converts it into alternating current (AC) electricity compatible with home appliances.',               icon: '🔌', color: '#dbeafe' },
            { title: 'Distribution Board',    description: 'AC electricity passes through the home\'s fuse box and is directed to lights, sockets, and appliances throughout the building.',                   icon: '🏠', color: '#dcfce7' },
            { title: 'Battery Storage',       description: '(Optional) Surplus electricity is stored in batteries for use at night or during cloudy periods.',                                                  icon: '🔋', color: '#fce7f3' },
            { title: 'Export to Grid',        description: 'Any remaining surplus is fed back into the national grid via a bidirectional smart meter, and homeowners may receive income through feed-in tariffs.', icon: '🔗', color: '#e0f2fe' },
            { title: 'Metering & Billing',    description: 'The smart meter records both electricity consumed from the grid and electricity exported, enabling accurate billing and earnings.',                  icon: '📊', color: '#f3e8ff' },
          ],
        },
      },
    ],
  },
];

export const TASK1_CHART_COLORS: Record<Task1ChartType, { bg: string; text: string; border: string; badge: string; progress: string; hover: string }> = {
  table:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'hover:border-blue-300',    badge: 'bg-blue-100 text-blue-700',    progress: 'bg-blue-500',    hover: 'group-hover:bg-blue-600 group-hover:text-white'    },
  bar:     { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-300', badge: 'bg-emerald-100 text-emerald-700', progress: 'bg-emerald-500', hover: 'group-hover:bg-emerald-600 group-hover:text-white' },
  line:    { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'hover:border-violet-300',  badge: 'bg-violet-100 text-violet-700',  progress: 'bg-violet-500',  hover: 'group-hover:bg-violet-600 group-hover:text-white'  },
  pie:     { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'hover:border-amber-300',   badge: 'bg-amber-100 text-amber-700',   progress: 'bg-amber-500',   hover: 'group-hover:bg-amber-600 group-hover:text-white'   },
  map:     { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'hover:border-teal-300',    badge: 'bg-teal-100 text-teal-700',    progress: 'bg-teal-500',    hover: 'group-hover:bg-teal-600 group-hover:text-white'    },
  process: { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'hover:border-rose-300',    badge: 'bg-rose-100 text-rose-700',    progress: 'bg-rose-500',    hover: 'group-hover:bg-rose-600 group-hover:text-white'    },
};
