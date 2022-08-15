// SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.9;

// // Import this file to use console.log
// import "hardhat/console.sol";

// contract Lock {
//     uint public unlockTime;
//     address payable public owner;

//     event Withdrawal(uint amount, uint when);

//     constructor(uint _unlockTime) payable {
//         require(
//             block.timestamp < _unlockTime,
//             "Unlock time should be in the future"
//         );

//         unlockTime = _unlockTime;
//         owner = payable(msg.sender);
//     }

//     function withdraw() public {
//         // Uncomment this line to print a log in your terminal
//         // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

//         require(block.timestamp >= unlockTime, "You can't withdraw yet");
//         require(msg.sender == owner, "You aren't the owner");

//         emit Withdrawal(address(this).balance, block.timestamp);

//         owner.transfer(address(this).balance);
//     }
// }

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    uint public constant tokenPrice = 0.01 ether;

    uint public constant tokensPerNft = 10 * 10**18;

    uint public constant maxTotalSupply = 10000 * 10**18;

    ICryptoDevs CryptoDevsNFT;

    mapping(uint => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("HiberNuts Token", "RJ") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint amount) public payable {
        uint _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect");

        uint256 amountWithDecimals = amount * 10**18;

        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply available."
        );
        _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        address sender = msg.sender;
      
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
       
        require(balance > 0, "You dont own any Crypto Dev NFT's");
       
        uint256 amount = 0;
       
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            // if the tokenId has not been claimed, increase the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
       
        require(amount > 0, "You have already claimed all the tokens");
      
        _mint(msg.sender, amount * tokensPerNft);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");

        // Function to receive Ether. msg.data must be empty
    }

    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
