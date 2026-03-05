import React, { useState } from 'react'
import { assets, cityList } from '../assets/assets'
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom';

const Hero = () => {

    const navigate = useNavigate()

    const [pickupLocation, setPickupLocation] = useState('');

    const { pickupDate, setPickupDate, returnDate, setReturnDate } = useAppContext();

    const handleSearch = (e) => {
        e.preventDefault();
        navigate('/cars?pickupLocation=' + pickupLocation + '&pickupDate=' + pickupDate + '&returnDate=' + returnDate)
    }

    return (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className='min-h-screen flex flex-col items-center justify-center text-center bg-light gap-7 pt-7 pb-0'>
            <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className='text-4xl sm:text-5xl pb-2 font-semibold'>Luxury cars on Rent
            </motion.h1>

            <motion.form
                initial={{ scale: 0.95, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onSubmit={handleSearch}
                className='flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 rounded-lg md:rounded-full w-full max-w-70 md:max-w-180 bg-white shadow-[0px_8px_20px_rgba(0,0,0,0.1)]'>

                <div className='flex flex-col md:flex-row gap-10 md:items-center items-start md:ml-6'>
                    <div className='flex flex-col items-start gap-1'>
                        <select required value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)}>
                            <option value="">Pickup location</option>
                            {cityList.map((city) => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <p className='px-1 text-sm text-gray-500'>{pickupLocation ? pickupLocation : "Please select location"}</p>
                    </div>

                    <div className='flex flex-col items-start gap-1'>
                        <label htmlFor="pickup-date">Pickup-Date</label>
                        <input value={pickupDate} onChange={e => setPickupDate(e.target.value)} type="date" id="pickup-date" min={new Date().toISOString().split('T')[0]} className='text-sm text-gray-500' required />
                    </div>

                    <div className='flex flex-col items-start gap-1'>
                        <label htmlFor="return-date">Return-Date</label>
                        <input value={returnDate} onChange={e => setReturnDate(e.target.value)} type="date" id="return-date" className='text-sm text-gray-500' required />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='flex items-center justify-center gap-1 px-6 py-2.5 max-sm:mt-4 cursor-pointer bg-primary hover:bg-primary-dull text-white rounded-full text-sm'>
                    <img src={assets.search_icon} alt="search" className='brightness-300 h-4' />
                    Search
                </motion.button>

            </motion.form>

            <motion.img
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                src={assets.main_car} className='max-h-60 w-auto' alt="Main Car" />
        </motion.div>
    )
}

export default Hero
